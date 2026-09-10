import json
import pytest
from gltest.assertions import tx_execution_failed, tx_execution_succeeded


def test_create_campaign(adshield_contract, brand_account):
    """Test locking funds and creating a campaign."""
    bounty = 1_000_000_000_000_000_000  # 1 GEN
    guidelines = "Include #AdShield and link https://adshield.pro in video description."
    platform = "YOUTUBE"
    timeout = 86400

    # Brand creates campaign
    receipt = adshield_contract.create_campaign(
        [guidelines, platform, timeout]
    ).transact(value=bounty)
    assert receipt is not None
    assert tx_execution_succeeded(receipt)

    # Check stats
    stats_raw = adshield_contract.get_stats().call()
    stats = json.loads(stats_raw)
    assert stats["total_campaigns"] >= 1
    assert int(stats["total_escrow_locked"]) >= bounty

    # Check campaign details
    campaign_raw = adshield_contract.get_campaign(["ad-1"]).call()
    camp = json.loads(campaign_raw)
    assert camp["campaign_id"] == "ad-1"
    assert camp["status"] == "OPEN"
    assert camp["platform"] == "YOUTUBE"
    assert camp["guidelines"] == guidelines
    assert int(camp["bounty_amount"]) == bounty
    assert camp["verdict"] == "PENDING"


def test_submit_content(adshield_contract, brand_account, creator_account):
    """Test creator submitting deliverable URL to trigger IN_REVIEW status."""
    bounty = 500_000_000_000_000_000  # 0.5 GEN
    adshield_contract.create_campaign(
        ["Post review on TikTok with #AdShieldPro", "TIKTOK", 86400]
    ).transact(value=bounty)

    creator_contract = adshield_contract.connect(creator_account)
    deliverable_url = "https://tiktok.com/@creator/video/123456789"

    # Submit content
    receipt = creator_contract.submit_content(
        ["ad-1", deliverable_url]
    ).transact()
    assert tx_execution_succeeded(receipt)

    camp = json.loads(adshield_contract.get_campaign(["ad-1"]).call())
    assert camp["status"] == "IN_REVIEW"
    assert camp["deliverable_url"] == deliverable_url
    assert camp["creator"].lower() == creator_account.address.lower()


def test_anti_cancel_protection(adshield_contract, brand_account, creator_account):
    """Verify Brand cannot cancel campaign once content has been submitted."""
    bounty = 1_000_000_000_000_000_000
    adshield_contract.create_campaign(
        ["Sponsored tweet with #AdShield", "X_TWITTER", 86400]
    ).transact(value=bounty)

    # Creator submits content
    creator_contract = adshield_contract.connect(creator_account)
    creator_contract.submit_content(
        ["ad-1", "https://x.com/creator/status/987654321"]
    ).transact()

    # Brand attempts cancellation -> must fail
    try:
        receipt = adshield_contract.cancel_campaign(["ad-1"]).transact()
        assert tx_execution_failed(receipt)
    except Exception as exc:
        assert "Cannot cancel" in str(exc) or "revert" in str(exc).lower() or "error" in str(exc).lower()


def test_successful_adjudication_compliant(adshield_contract, brand_account, creator_account, install_mocks):
    """Test compliant content adjudication entering AWAITING_PAYOUT and settlement."""
    bounty = 1_000_000_000_000_000_000
    deliverable_url = "https://myblog.com/posts/adshield-review"

    # Use timeout 0 to allow instant settlement verification
    adshield_contract.create_campaign(
        ["Review AdShield Pro with affiliate link https://adshield.pro and tag #AdShield", "BLOG", 0]
    ).transact(value=bounty)

    creator_contract = adshield_contract.connect(creator_account)
    creator_contract.submit_content(
        ["ad-1", deliverable_url]
    ).transact()

    # Install bare-dict mocks for web extraction and LLM response
    install_mocks(
        web_mocks={
            deliverable_url: "Today we review AdShield Pro! Visit https://adshield.pro for secure escrows. #AdShield"
        },
        llm_mocks={
            "AdShield Marketing Court": json.dumps({
                "verdict": "COMPLIANT",
                "confidence": 98,
                "compliance_score": 95,
                "reason": "Brand mention, URL, and tag are all present and positive."
            })
        }
    )

    # Run adjudication
    receipt = adshield_contract.adjudicate(["ad-1"]).transact()
    assert tx_execution_succeeded(receipt)

    # Insolvent Appeal protection: status is AWAITING_PAYOUT with funds preserved
    camp = json.loads(adshield_contract.get_campaign(["ad-1"]).call())
    assert camp["status"] == "AWAITING_PAYOUT"
    assert camp["verdict"] == "COMPLIANT"
    assert camp["compliance_score"] == 95

    # Finalize settlement
    settle_receipt = adshield_contract.finalize_settlement(["ad-1"]).transact()
    assert tx_execution_succeeded(settle_receipt)

    camp_settled = json.loads(adshield_contract.get_campaign(["ad-1"]).call())
    assert camp_settled["status"] == "RESOLVED_PAID"


def test_failed_adjudication_violated(adshield_contract, brand_account, creator_account, install_mocks):
    """Test non-compliant content entering AWAITING_PAYOUT and refunding brand."""
    bounty = 800_000_000_000_000_000
    deliverable_url = "https://youtube.com/watch?v=deleted_video"

    adshield_contract.create_campaign(
        ["Must feature AdShield logo and link", "YOUTUBE", 0]
    ).transact(value=bounty)

    creator_contract = adshield_contract.connect(creator_account)
    creator_contract.submit_content(
        ["ad-1", deliverable_url]
    ).transact()

    # Install mock for unavailable or violating page
    install_mocks(
        web_mocks={
            deliverable_url: ""  # Empty content triggers fetch error fallback
        },
        llm_mocks={
            "AdShield Marketing Court": json.dumps({
                "verdict": "VIOLATED",
                "confidence": 100,
                "compliance_score": 0,
                "reason": "Could not access or render deliverable URL."
            })
        }
    )

    receipt = adshield_contract.adjudicate(["ad-1"]).transact()
    assert tx_execution_succeeded(receipt)

    camp = json.loads(adshield_contract.get_campaign(["ad-1"]).call())
    assert camp["status"] == "AWAITING_PAYOUT"
    assert camp["verdict"] == "VIOLATED"

    # Finalize refund
    settle_receipt = adshield_contract.finalize_settlement(["ad-1"]).transact()
    assert tx_execution_succeeded(settle_receipt)

    camp_refunded = json.loads(adshield_contract.get_campaign(["ad-1"]).call())
    assert camp_refunded["status"] == "RESOLVED_REFUNDED"


def test_claim_timeout_payout(adshield_contract, brand_account, creator_account):
    """Test creator claiming timeout payout when review window passes."""
    bounty = 600_000_000_000_000_000
    adshield_contract.create_campaign(
        ["Post YouTube Short", "YOUTUBE", 0]
    ).transact(value=bounty)

    creator_contract = adshield_contract.connect(creator_account)
    creator_contract.submit_content(
        ["ad-1", "https://youtube.com/shorts/sample123"]
    ).transact()

    # Creator claims timeout
    receipt = creator_contract.claim_timeout_payout(["ad-1"]).transact()
    assert tx_execution_succeeded(receipt)

    camp = json.loads(adshield_contract.get_campaign(["ad-1"]).call())
    assert camp["status"] == "RESOLVED_PAID"
    assert camp["verdict"] == "TIMEOUT_APPROVED"
    assert camp["compliance_score"] == 100


def test_file_dispute_appeal(adshield_contract, brand_account, creator_account, install_mocks):
    """Test filing dispute appeal during AWAITING_PAYOUT by staking 20% appeal bond."""
    bounty = 1_000_000_000_000_000_000  # 1 GEN
    deliverable_url = "https://x.com/creator/status/111222333"

    adshield_contract.create_campaign(
        ["Tweet #AdShield sponsor", "X_TWITTER", 86400]
    ).transact(value=bounty)

    creator_contract = adshield_contract.connect(creator_account)
    creator_contract.submit_content(
        ["ad-1", deliverable_url]
    ).transact()

    # Initial adjudication marked VIOLATED
    install_mocks(
        web_mocks={deliverable_url: "Tweet without hashtag"},
        llm_mocks={
            "AdShield Marketing Court": json.dumps({
                "verdict": "VIOLATED",
                "confidence": 90,
                "compliance_score": 30,
                "reason": "Missing hashtag."
            })
        }
    )
    adshield_contract.adjudicate(["ad-1"]).transact()

    # Verify status is AWAITING_PAYOUT (funds still in escrow)
    camp = json.loads(adshield_contract.get_campaign(["ad-1"]).call())
    assert camp["status"] == "AWAITING_PAYOUT"

    # Creator stakes 20% appeal bond (0.2 GEN)
    appeal_bond = bounty // 5
    receipt = creator_contract.file_dispute_appeal(
        ["ad-1"]
    ).transact(value=appeal_bond)
    assert tx_execution_succeeded(receipt)

    # Verify status changed to DISPUTED
    camp_appealed = json.loads(adshield_contract.get_campaign(["ad-1"]).call())
    assert camp_appealed["status"] == "DISPUTED"
    assert int(camp_appealed["appeal_bond"]) == appeal_bond


def test_get_all_campaigns(adshield_contract, brand_account):
    """Test public view get_all_campaigns returning valid JSON list."""
    adshield_contract.create_campaign(
        ["Test Campaign 1", "BLOG", 86400]
    ).transact(value=100_000_000_000_000_000)

    raw_all = adshield_contract.get_all_campaigns().call()
    campaigns = json.loads(raw_all)
    assert isinstance(campaigns, list)
    assert len(campaigns) >= 1
    assert campaigns[0]["campaign_id"] == "ad-1"
    assert "payout_ready_at" in campaigns[0]
    assert "disputed_at" in campaigns[0]

# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass
import json


def _addr_str(addr: Address) -> str:
    try:
        return addr.as_hex
    except Exception:
        return str(addr)


@allow_storage
@dataclass
class Campaign:
    campaign_id: str
    brand: Address
    creator: Address
    bounty_amount: bigint
    appeal_bond: bigint
    guidelines: str
    platform: str
    deliverable_url: str
    status: u8                     # 0: OPEN, 1: IN_REVIEW, 2: RESOLVED_PAID, 3: RESOLVED_REFUNDED, 4: CANCELLED, 5: IN_APPEAL
    verdict: str                   # "PENDING", "COMPLIANT", "VIOLATED", "TIMEOUT_APPROVED", "IN_APPEAL"
    reason: str
    confidence: u8
    compliance_score: u8
    submitted_at: u256
    timeout_duration: u256
    created_at_block: u256


class Contract(gl.Contract):
    campaigns: TreeMap[str, Campaign]
    campaign_ids: DynArray[str]
    total_escrow_locked: bigint
    total_campaigns_settled: u32
    campaign_counter: u64

    def __init__(self):
        self.total_escrow_locked = bigint(0)
        self.total_campaigns_settled = u32(0)
        self.campaign_counter = u64(0)

    @gl.public.write.payable
    def create_campaign(self, guidelines: str, platform: str, timeout_seconds: int) -> str:
        budget = bigint(gl.message.value)
        if budget <= bigint(0):
            raise gl.vm.UserError("Marketing escrow budget must be greater than 0 GEN.")

        if not guidelines or len(guidelines.strip()) == 0:
            raise gl.vm.UserError("Marketing guidelines cannot be empty.")

        clean_platform = platform.strip().upper()
        if clean_platform not in ("YOUTUBE", "X_TWITTER", "TIKTOK", "BLOG"):
            clean_platform = "BLOG"

        duration = u256(timeout_seconds if timeout_seconds > 0 else 172800)

        self.campaign_counter = self.campaign_counter + u64(1)
        campaign_id = f"ad-{int(self.campaign_counter)}"
        current_block = u256(int(self.campaign_counter))
        empty_creator = Address("0x0000000000000000000000000000000000000000")

        new_campaign = Campaign(
            campaign_id=campaign_id,
            brand=gl.message.sender_address,
            creator=empty_creator,
            bounty_amount=budget,
            appeal_bond=bigint(0),
            guidelines=guidelines.strip(),
            platform=clean_platform,
            deliverable_url="",
            status=u8(0),
            verdict="PENDING",
            reason="Awaiting creator deliverable URL submission.",
            confidence=u8(0),
            compliance_score=u8(0),
            submitted_at=u256(0),
            timeout_duration=duration,
            created_at_block=current_block,
        )

        self.campaigns[campaign_id] = new_campaign
        self.campaign_ids.append(campaign_id)
        self.total_escrow_locked = self.total_escrow_locked + budget

        return campaign_id

    @gl.public.write
    def submit_content(self, campaign_id: str, deliverable_url: str) -> None:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError(f"Campaign {campaign_id} does not exist.")

        camp = self.campaigns[campaign_id]
        if camp.status != u8(0):
            raise gl.vm.UserError(f"Campaign {campaign_id} is not open for submission.")

        clean_url = deliverable_url.strip()
        if not clean_url.startswith("http"):
            raise gl.vm.UserError("Valid live content URL is required.")

        camp.creator = gl.message.sender_address
        camp.deliverable_url = clean_url
        camp.status = u8(1)
        camp.submitted_at = u256(int(self.campaign_counter))
        camp.reason = "Deliverable submitted. Review window started."

    @gl.public.write
    def adjudicate(self, campaign_id: str) -> None:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError(f"Campaign {campaign_id} does not exist.")

        camp = self.campaigns[campaign_id]
        if camp.status != u8(1) and camp.status != u8(5):
            raise gl.vm.UserError(f"Campaign {campaign_id} is not awaiting review or appeal.")

        content_url = camp.deliverable_url
        guidelines_text = camp.guidelines
        platform_name = camp.platform

        def leader_fn():
            page_content = ""
            fetch_error = False
            try:
                page_content = gl.nondet.web.render(content_url, mode="text")
            except Exception:
                fetch_error = True

            if fetch_error or not page_content or len(page_content.strip()) == 0:
                return {
                    "verdict": "VIOLATED",
                    "confidence": 100,
                    "compliance_score": 0,
                    "reason": "Could not access or render deliverable URL. Page is missing, private, or deleted."
                }

            truncated_content = page_content[:6500] if len(page_content) > 6500 else page_content

            prompt = f"""You are the Lead Auditor of the AdShield Marketing Court on GenLayer.
Evaluate whether the Creator's published content satisfies the Brand's Advertising Guidelines.

PLATFORM: {platform_name}
CONTENT URL: {content_url}

BRAND GUIDELINES:
{guidelines_text}

LIVE EXTRACTED EVIDENCE:
{truncated_content}

CRITERIA:
1. Verify required brand mentions, promotional hashtags, or affiliate links are intact.
2. Confirm the deliverable is genuine, non-defamatory, and matches campaign context.
3. Compute a compliance_score (0-100).
4. Output "COMPLIANT" if compliance_score >= 70, otherwise "VIOLATED".

Respond ONLY in valid JSON:
{{
  "verdict": "COMPLIANT"|"VIOLATED",
  "confidence": <0-100>,
  "compliance_score": <0-100>,
  "reason": "<qualitative audit explanation>"
}}"""

            raw_res = gl.nondet.exec_prompt(prompt, response_format="json")

            parsed = None
            if isinstance(raw_res, dict):
                parsed = raw_res
            elif isinstance(raw_res, str):
                cleaned = raw_res.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                elif cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                try:
                    parsed = json.loads(cleaned)
                except Exception:
                    pass

            if not parsed or "verdict" not in parsed:
                return {
                    "verdict": "VIOLATED",
                    "confidence": 50,
                    "compliance_score": 0,
                    "reason": "Validator failed to parse adjudication output."
                }

            verdict_str = str(parsed.get("verdict", "")).strip().upper()
            if verdict_str not in ("COMPLIANT", "VIOLATED"):
                verdict_str = "VIOLATED"

            def _clean_num(val, default):
                try:
                    s = int(val)
                    return max(0, min(100, s))
                except Exception:
                    return default

            conf_val = _clean_num(parsed.get("confidence"), 80)
            score_val = _clean_num(parsed.get("compliance_score"), 75 if verdict_str == "COMPLIANT" else 25)
            reason_str = str(parsed.get("reason", "Consensus audit rendered."))

            return {
                "verdict": verdict_str,
                "confidence": conf_val,
                "compliance_score": score_val,
                "reason": reason_str
            }

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            leader = leader_res.calldata
            if not isinstance(leader, dict) or "verdict" not in leader:
                return False

            mine = leader_fn()
            return mine["verdict"] == leader["verdict"]

        adjudication_res = gl.vm.run_nondet(leader_fn, validator_fn)

        verdict = adjudication_res["verdict"]
        reason = adjudication_res["reason"]
        confidence = u8(int(adjudication_res["confidence"]))
        compliance_score = u8(int(adjudication_res["compliance_score"]))

        camp.verdict = verdict
        camp.reason = reason
        camp.confidence = confidence
        camp.compliance_score = compliance_score

        bounty_val = camp.bounty_amount
        bond_val = camp.appeal_bond
        total_payout = bounty_val + bond_val

        self.total_escrow_locked = self.total_escrow_locked - bounty_val
        self.total_campaigns_settled = self.total_campaigns_settled + u32(1)

        if verdict == "COMPLIANT":
            camp.status = u8(2)
            gl.get_contract_at(camp.creator).emit_transfer(value=u256(total_payout))
        else:
            camp.status = u8(3)
            gl.get_contract_at(camp.brand).emit_transfer(value=u256(total_payout))

    @gl.public.write
    def claim_timeout_payout(self, campaign_id: str) -> None:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError(f"Campaign {campaign_id} does not exist.")

        camp = self.campaigns[campaign_id]
        if camp.status != u8(1):
            raise gl.vm.UserError("Auto-payout only applies to deliverables currently IN_REVIEW.")

        if gl.message.sender_address != camp.creator:
            raise gl.vm.UserError("Only the participating Creator can trigger timeout auto-payout.")

        camp.status = u8(2)
        camp.verdict = "TIMEOUT_APPROVED"
        camp.reason = "Review window expired without adjudication. Escrow automatically paid out to Creator."
        camp.compliance_score = u8(100)

        bounty_val = camp.bounty_amount
        self.total_escrow_locked = self.total_escrow_locked - bounty_val
        self.total_campaigns_settled = self.total_campaigns_settled + u32(1)

        gl.get_contract_at(camp.creator).emit_transfer(value=u256(bounty_val))

    @gl.public.write.payable
    def file_dispute_appeal(self, campaign_id: str) -> None:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError(f"Campaign {campaign_id} does not exist.")

        camp = self.campaigns[campaign_id]
        if camp.status not in (u8(2), u8(3)):
            raise gl.vm.UserError("Only finalized campaigns can be appealed.")

        sender = gl.message.sender_address
        if sender != camp.brand and sender != camp.creator:
            raise gl.vm.UserError("Only Brand or Creator can dispute this campaign.")

        min_bond = camp.bounty_amount // bigint(5)
        if min_bond <= bigint(0):
            min_bond = bigint(1)

        staked = bigint(gl.message.value)
        if staked < min_bond:
            raise gl.vm.UserError(f"Appeal bond must be at least {int(min_bond)} wei (20% of bounty).")

        camp.appeal_bond = camp.appeal_bond + staked
        camp.status = u8(5)
        camp.verdict = "IN_APPEAL"
        camp.reason = f"Dispute appeal filed by {sender}. Case reopened for jury re-audit."

    @gl.public.write
    def cancel_campaign(self, campaign_id: str) -> None:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError(f"Campaign {campaign_id} does not exist.")

        camp = self.campaigns[campaign_id]
        if gl.message.sender_address != camp.brand:
            raise gl.vm.UserError("Only the Brand creator can cancel this campaign.")

        if camp.status != u8(0):
            raise gl.vm.UserError("Cannot cancel: Content has already been submitted or review is in progress.")

        camp.status = u8(4)
        camp.verdict = "CANCELLED"
        camp.reason = "Campaign cancelled by brand prior to creator submission."

        bounty_val = camp.bounty_amount
        self.total_escrow_locked = self.total_escrow_locked - bounty_val

        gl.get_contract_at(camp.brand).emit_transfer(value=u256(bounty_val))

    @gl.public.view
    def get_campaign(self, campaign_id: str) -> str:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError(f"Campaign {campaign_id} does not exist.")

        c = self.campaigns[campaign_id]
        data = {
            "campaign_id": c.campaign_id,
            "brand": _addr_str(c.brand),
            "creator": _addr_str(c.creator),
            "bounty_amount": str(c.bounty_amount),
            "appeal_bond": str(c.appeal_bond),
            "guidelines": c.guidelines,
            "platform": c.platform,
            "deliverable_url": c.deliverable_url,
            "status": int(c.status),
            "verdict": c.verdict,
            "reason": c.reason,
            "confidence": int(c.confidence),
            "compliance_score": int(c.compliance_score),
            "submitted_at": str(c.submitted_at),
            "timeout_duration": str(c.timeout_duration),
            "created_at_block": str(c.created_at_block),
        }
        return json.dumps(data)

    @gl.public.view
    def get_campaign_count(self) -> int:
        return len(self.campaign_ids)

    @gl.public.view
    def get_campaign_id_by_index(self, idx: int) -> str:
        if idx < 0 or idx >= len(self.campaign_ids):
            raise gl.vm.UserError("Index out of bounds.")
        return self.campaign_ids[idx]

    @gl.public.view
    def get_stats(self) -> str:
        data = {
            "total_campaigns": len(self.campaign_ids),
            "total_escrow_locked": str(self.total_escrow_locked),
            "total_campaigns_settled": int(self.total_campaigns_settled),
        }
        return json.dumps(data)

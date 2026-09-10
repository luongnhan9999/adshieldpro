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
    brand: str
    creator: str
    bounty_amount: bigint
    appeal_bond: bigint
    guidelines: str
    platform: str
    deliverable_url: str
    status: str            # OPEN, IN_REVIEW, AWAITING_PAYOUT, RESOLVED_PAID, RESOLVED_REFUNDED, DISPUTED, CANCELLED
    verdict: str           # PENDING, COMPLIANT, VIOLATED, ESCALATE, TIMEOUT_APPROVED, CANCELLED
    reason: str
    confidence: bigint
    compliance_score: bigint
    submitted_at: bigint
    timeout_duration: bigint
    payout_ready_at: bigint
    disputed_at: bigint


class Contract(gl.Contract):
    platform_admin: str
    campaigns: TreeMap[str, Campaign]
    campaign_ids: DynArray[str]
    total_escrow_locked: bigint
    total_campaigns_settled: bigint
    campaign_counter: bigint

    def __init__(self):
        self.platform_admin = str(gl.message.sender_address).lower()
        self.total_escrow_locked = bigint(0)
        self.total_campaigns_settled = bigint(0)
        self.campaign_counter = bigint(0)

    def _get_current_timestamp(self) -> bigint:
        """
        Derive trusted execution timestamp strictly from transaction context.
        FAIL-CLOSED INVARIANT: Raises UserError immediately if timestamp context 
        is missing, malformed, or non-positive. Never falls back to non-deterministic time.time().
        """
        if not hasattr(gl, "message_raw") or not isinstance(gl.message_raw, dict):
            raise gl.vm.UserError("Trusted execution timestamp context missing from transaction")

        dt_raw = gl.message_raw.get("datetime", None)
        if not dt_raw:
            raise gl.vm.UserError("Trusted timestamp 'datetime' missing from transaction context")

        try:
            from datetime import datetime
            dt_str = str(dt_raw)
            if dt_str.endswith("Z"):
                dt_str = dt_str[:-1] + "+00:00"
            dt = datetime.fromisoformat(dt_str)
            ts = int(dt.timestamp())
            if ts <= 0:
                raise gl.vm.UserError("Invalid non-positive execution timestamp resolved")
            return bigint(ts)
        except Exception as e:
            raise gl.vm.UserError(f"Failed to parse runtime ISO timestamp: {str(e)}")

    def _parse_llm_json(self, response_str: str) -> dict:
        if isinstance(response_str, dict):
            return response_str
        if hasattr(response_str, "__dict__"):
            return response_str.__dict__
        t = str(response_str).strip()
        if t.startswith("```json"):
            t = t[7:]
        elif t.startswith("```"):
            t = t[3:]
        if t.endswith("```"):
            t = t[:-3]
        try:
            return json.loads(t.strip())
        except Exception as e:
            return {"verdict": "VIOLATED", "confidence": 0, "compliance_score": 0, "reason": f"JSON parse failure: {str(e)}"}

    def _effective_verdict(self, data: dict) -> str:
        verdict = str(data.get("verdict", "VIOLATED")).upper().strip()
        if verdict not in {"COMPLIANT", "VIOLATED", "ESCALATE"}:
            verdict = "VIOLATED"
        try:
            conf = int(data.get("confidence", 0))
        except Exception:
            conf = 0
        if conf < 65:
            verdict = "ESCALATE"
        return verdict

    @gl.public.write.payable
    def create_campaign(self, guidelines: str, platform: str, timeout_seconds: int = 172800) -> str:
        budget = bigint(gl.message.value)
        if budget <= bigint(0):
            raise gl.vm.UserError("Marketing escrow budget must be greater than 0 GEN.")

        if not guidelines or len(guidelines.strip()) == 0:
            raise gl.vm.UserError("Marketing guidelines cannot be empty.")

        clean_platform = platform.strip().upper()
        if clean_platform not in ("YOUTUBE", "X_TWITTER", "TIKTOK", "BLOG"):
            clean_platform = "BLOG"

        self.campaign_counter += bigint(1)
        campaign_id = f"ad-{int(self.campaign_counter)}"
        caller = str(gl.message.sender_address).lower()
        duration = bigint(timeout_seconds) if timeout_seconds >= 0 else bigint(172800)

        self.campaigns[campaign_id] = Campaign(
            campaign_id=campaign_id,
            brand=caller,
            creator="0x0000000000000000000000000000000000000000",
            bounty_amount=budget,
            appeal_bond=bigint(0),
            guidelines=guidelines.strip(),
            platform=clean_platform,
            deliverable_url="",
            status="OPEN",
            verdict="PENDING",
            reason="Awaiting creator deliverable submission.",
            confidence=bigint(0),
            compliance_score=bigint(0),
            submitted_at=bigint(0),
            timeout_duration=duration,
            payout_ready_at=bigint(0),
            disputed_at=bigint(0)
        )
        self.campaign_ids.append(campaign_id)
        self.total_escrow_locked += budget
        return campaign_id

    @gl.public.write
    def submit_content(self, campaign_id: str, deliverable_url: str) -> None:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError(f"Campaign {campaign_id} does not exist.")

        camp = self.campaigns[campaign_id]
        if camp.status != "OPEN":
            raise gl.vm.UserError(f"Campaign {campaign_id} is not open for submission.")

        caller = str(gl.message.sender_address).lower()
        if caller == camp.brand:
            raise gl.vm.UserError("Brand Sponsor cannot submit deliverables to their own campaign.")

        clean_url = deliverable_url.strip()
        if not clean_url.startswith("http"):
            raise gl.vm.UserError("Valid live content URL is required.")

        now = self._get_current_timestamp()
        camp.creator = caller
        camp.deliverable_url = clean_url
        camp.status = "IN_REVIEW"
        camp.submitted_at = now
        camp.reason = "Deliverable submitted. Review window started."
        self.campaigns[campaign_id] = camp

    @gl.public.write
    def adjudicate(self, campaign_id: str) -> None:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError(f"Campaign {campaign_id} does not exist.")

        camp = self.campaigns[campaign_id]
        if camp.status not in ["IN_REVIEW", "DISPUTED"]:
            raise gl.vm.UserError(f"Campaign {campaign_id} is not awaiting review or dispute.")

        caller = str(gl.message.sender_address).lower()
        if caller != camp.brand and caller != camp.creator:
            raise gl.vm.UserError("Unauthorized: Only the Brand Sponsor or Assigned Creator can trigger adjudication.")

        content_url = camp.deliverable_url
        guidelines_text = camp.guidelines
        platform_name = camp.platform

        def leader_fn() -> dict:
            try:
                page_content = gl.nondet.web.render(content_url, mode="text")
                clean_content = str(page_content)
                if not clean_content or len(clean_content.strip()) == 0 or any(err in clean_content[:400].lower() for err in ["404 not found", "error 404", "not found"]):
                    return {
                        "verdict": "VIOLATED",
                        "confidence": 100,
                        "compliance_score": 0,
                        "reason": "Could not render deliverable URL. Page returned 404 or missing."
                    }
            except Exception as e:
                return {
                    "verdict": "VIOLATED",
                    "confidence": 100,
                    "compliance_score": 0,
                    "reason": f"Web render failed: {str(e)}"
                }

            # UNTRUNCATED FULL EVIDENCE PROMPT (No truncation)
            prompt = f"""You are the Lead Auditor of the AdShield Marketing Court on GenLayer.
Evaluate whether the Creator's published content satisfies the Brand's Advertising Guidelines without truncation.

PLATFORM: {platform_name}
CONTENT URL: {content_url}

BRAND GUIDELINES:
{guidelines_text}

LIVE EXTRACTED EVIDENCE (FULL CONTENT):
{clean_content}

CRITERIA:
1. Verify required brand mentions, promotional hashtags, or affiliate links are present.
2. Confirm the deliverable is genuine, non-defamatory, and matches campaign context.
3. Compute a compliance_score (0-100).
4. Output "COMPLIANT" if compliance_score >= 70, otherwise "VIOLATED".

Respond ONLY with valid JSON:
{{
  "verdict": "COMPLIANT|VIOLATED|ESCALATE",
  "confidence": 0-100,
  "compliance_score": 0-100,
  "reason": "Clear qualitative audit explanation"
}}"""
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if isinstance(res, dict):
                return res
            return self._parse_llm_json(str(res))

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            leader_data = leader_res.calldata if hasattr(leader_res, "calldata") else leader_res
            if not isinstance(leader_data, dict):
                leader_data = self._parse_llm_json(str(leader_data))
            mine_data = leader_fn()
            return self._effective_verdict(leader_data) == self._effective_verdict(mine_data)

        adjudication_res = gl.vm.run_nondet(leader_fn, validator_fn)
        if not isinstance(adjudication_res, dict):
            adjudication_res = self._parse_llm_json(str(adjudication_res))

        final_verdict = self._effective_verdict(adjudication_res)
        try:
            conf = int(adjudication_res.get("confidence", 0))
        except Exception:
            conf = 0
        try:
            score = int(adjudication_res.get("compliance_score", 0))
        except Exception:
            score = 0

        camp.verdict = final_verdict
        camp.reason = str(adjudication_res.get("reason", "Consensus reached"))
        camp.confidence = bigint(conf)
        camp.compliance_score = bigint(score)

        now = self._get_current_timestamp()

        # ENFORCE 24H DISPUTE COOLING-OFF: Payout is strictly time-locked for 24 hours (86400s)
        if final_verdict in ["COMPLIANT", "VIOLATED"]:
            camp.status = "AWAITING_PAYOUT"
            camp.payout_ready_at = now + bigint(86400)
        else:
            camp.status = "DISPUTED"

        self.campaigns[campaign_id] = camp

    @gl.public.write.payable
    def file_dispute(self, campaign_id: str, dispute_reason: str = "") -> None:
        """Lock payout during the 24h window if either party disagrees."""
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError("Campaign does not exist.")
        camp = self.campaigns[campaign_id]
        if camp.status != "AWAITING_PAYOUT":
            raise gl.vm.UserError("Can only dispute during AWAITING_PAYOUT window.")

        sender = str(gl.message.sender_address).lower()
        if sender != camp.brand and sender != camp.creator:
            raise gl.vm.UserError("Only Brand or Creator can dispute.")

        now = self._get_current_timestamp()
        if now > camp.payout_ready_at:
            raise gl.vm.UserError("24-hour dispute window has elapsed.")

        min_bond = camp.bounty_amount // bigint(5)  # 20% bond
        if bigint(gl.message.value) < min_bond:
            raise gl.vm.UserError(f"Appeal bond must be at least 20% of bounty ({min_bond} wei).")

        camp.appeal_bond += bigint(gl.message.value)
        camp.status = "DISPUTED"
        camp.disputed_at = now
        reason_suffix = f" {dispute_reason.strip()}" if dispute_reason.strip() else ""
        camp.reason = f"[DISPUTED by {sender[:8]}]{reason_suffix}"
        self.campaigns[campaign_id] = camp

    @gl.public.write.payable
    def file_dispute_appeal(self, campaign_id: str) -> None:
        """Alias for file_dispute for backwards compatibility with test suites and frontend."""
        self.file_dispute(campaign_id, "Dispute appeal filed.")

    @gl.public.write
    def finalize_settlement(self, campaign_id: str) -> None:
        """Disburses escrow strictly after the 24h cooling-off window when undisputed."""
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError("Campaign does not exist.")
        camp = self.campaigns[campaign_id]
        if camp.status != "AWAITING_PAYOUT":
            raise gl.vm.UserError("Campaign is not awaiting payout or is currently disputed.")

        caller = str(gl.message.sender_address).lower()
        if caller != camp.brand and caller != camp.creator:
            raise gl.vm.UserError("Unauthorized: Only the Brand Sponsor or Assigned Creator can finalize settlement.")

        now = self._get_current_timestamp()
        if now < camp.payout_ready_at:
            raise gl.vm.UserError("24-hour cooling-off period has not elapsed yet.")

        bounty_val = camp.bounty_amount
        bond_val = camp.appeal_bond
        creator_addr = camp.creator
        brand_addr = camp.brand

        camp.bounty_amount = bigint(0)
        camp.appeal_bond = bigint(0)
        self.total_escrow_locked -= bounty_val
        self.total_campaigns_settled += bigint(1)

        if camp.verdict == "COMPLIANT":
            camp.status = "RESOLVED_PAID"
            # Creator receives bounty + appeal bond refund if any
            gl.get_contract_at(Address(creator_addr)).emit_transfer(value=u256(bounty_val + bond_val))
        else:
            camp.status = "RESOLVED_REFUNDED"
            # Brand receives bounty refund + appeal bond if brand won
            gl.get_contract_at(Address(brand_addr)).emit_transfer(value=u256(bounty_val + bond_val))

        self.campaigns[campaign_id] = camp

    @gl.public.write
    def claim_timeout_payout(self, campaign_id: str) -> None:
        """Creator can claim auto-payout ONLY if brand fails to adjudicate after full timeout duration."""
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError("Campaign does not exist.")
        camp = self.campaigns[campaign_id]
        if camp.status != "IN_REVIEW":
            raise gl.vm.UserError("Auto-payout only applies to deliverables currently IN_REVIEW.")

        if str(gl.message.sender_address).lower() != camp.creator:
            raise gl.vm.UserError("Only the participating Creator can trigger timeout auto-payout.")

        now = self._get_current_timestamp()
        if now < camp.submitted_at + camp.timeout_duration:
            raise gl.vm.UserError("Review window has not expired yet.")

        bounty_val = camp.bounty_amount
        creator_addr = camp.creator

        camp.status = "RESOLVED_PAID"
        camp.verdict = "TIMEOUT_APPROVED"
        camp.compliance_score = bigint(100)
        camp.reason = "Review window expired without adjudication. Escrow paid out to Creator."
        camp.bounty_amount = bigint(0)
        self.total_escrow_locked -= bounty_val
        self.total_campaigns_settled += bigint(1)

        gl.get_contract_at(Address(creator_addr)).emit_transfer(value=u256(bounty_val))
        self.campaigns[campaign_id] = camp

    @gl.public.write
    def cancel_campaign(self, campaign_id: str) -> None:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError("Campaign does not exist.")
        camp = self.campaigns[campaign_id]
        if str(gl.message.sender_address).lower() != camp.brand:
            raise gl.vm.UserError("Only the Brand creator can cancel this campaign.")

        if camp.status != "OPEN":
            raise gl.vm.UserError("Cannot cancel: Content has already been submitted or review is in progress.")

        bounty_val = camp.bounty_amount
        brand_addr = camp.brand

        camp.status = "CANCELLED"
        camp.verdict = "CANCELLED"
        camp.bounty_amount = bigint(0)
        self.total_escrow_locked -= bounty_val

        gl.get_contract_at(Address(brand_addr)).emit_transfer(value=u256(bounty_val))
        self.campaigns[campaign_id] = camp

    @gl.public.view
    def get_all_campaigns(self) -> str:
        """Authoritative public view for instant frontend synchronization."""
        res = []
        for cid in self.campaign_ids:
            if cid in self.campaigns:
                c = self.campaigns[cid]
                res.append({
                    "campaign_id": c.campaign_id,
                    "brand": c.brand,
                    "creator": c.creator,
                    "bounty_amount": str(c.bounty_amount),
                    "appeal_bond": str(c.appeal_bond),
                    "guidelines": c.guidelines,
                    "platform": c.platform,
                    "deliverable_url": c.deliverable_url,
                    "status": c.status,
                    "verdict": c.verdict,
                    "reason": c.reason,
                    "confidence": int(c.confidence),
                    "compliance_score": int(c.compliance_score),
                    "submitted_at": str(c.submitted_at),
                    "timeout_duration": str(c.timeout_duration),
                    "payout_ready_at": str(c.payout_ready_at),
                    "disputed_at": str(c.disputed_at)
                })
        return json.dumps(res)

    @gl.public.view
    def get_campaign(self, campaign_id: str) -> str:
        if campaign_id not in self.campaigns:
            raise gl.vm.UserError(f"Campaign {campaign_id} does not exist.")
        c = self.campaigns[campaign_id]
        return json.dumps({
            "campaign_id": c.campaign_id,
            "brand": c.brand,
            "creator": c.creator,
            "bounty_amount": str(c.bounty_amount),
            "appeal_bond": str(c.appeal_bond),
            "guidelines": c.guidelines,
            "platform": c.platform,
            "deliverable_url": c.deliverable_url,
            "status": c.status,
            "verdict": c.verdict,
            "reason": c.reason,
            "confidence": int(c.confidence),
            "compliance_score": int(c.compliance_score),
            "submitted_at": str(c.submitted_at),
            "timeout_duration": str(c.timeout_duration),
            "payout_ready_at": str(c.payout_ready_at),
            "disputed_at": str(c.disputed_at)
        })

    @gl.public.view
    def get_stats(self) -> str:
        return json.dumps({
            "total_campaigns": len(self.campaign_ids),
            "total_escrow_locked": str(self.total_escrow_locked),
            "total_campaigns_settled": int(self.total_campaigns_settled),
        })

    @gl.public.view
    def get_campaign_count(self) -> int:
        return len(self.campaign_ids)

    @gl.public.view
    def get_campaign_id_by_index(self, index: int) -> str:
        if index < 0 or index >= len(self.campaign_ids):
            raise gl.vm.UserError("Index out of bounds")
        return self.campaign_ids[index]

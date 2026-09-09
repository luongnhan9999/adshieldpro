# AdShield Pro 🛡️
### Autonomous Creator Marketing Escrow & Mutual-Protection Court on GenLayer

> **Agent Tank Hackathon** — Track: **Subjective Consensus & Future of Work / Creator Economy**  
> **Target Network:** GenLayer Studionet (`Chain ID: 61999` / `0xF1EF`, RPC: `https://studio.genlayer.com/api`)  
> **Live Web3 dApp:** [https://adshieldpro-app.vercel.app](https://adshieldpro-app.vercel.app) (Mirror: [https://adshieldpro-genlayer.vercel.app](https://adshieldpro-genlayer.vercel.app))  
> **GitHub Repository:** [https://github.com/luongnhan9999/adshieldpro](https://github.com/luongnhan9999/adshieldpro)

---

## 🌟 Executive Summary

Influencer and creator marketing is currently plagued by mutual distrust:
1. **Brands fear paying upfront:** Creators might never publish the post, fail to follow guidelines, or delete the sponsored content immediately after getting paid.
2. **Creators fear arbitrary rejections:** Brands frequently claim subjective dissatisfaction after the creator spends hours shooting content, refusing payout or ghosting the creator.

**AdShield Pro** eliminates this dilemma by deploying an **Autonomous Marketing Escrow & Subjective Consensus Court** powered by **GenLayer Studionet** and **GenVM**:
- **Smart Escrow:** Brands lock native `GEN` tokens on-chain with customized guidelines and timeout windows.
- **Anti-Cancel Protection:** Once a creator submits a live deliverable link, the contract irrevocably locks the funds into review—brands **cannot** cancel or pull funds.
- **Live On-Chain Web Extraction:** The contract autonomously crawls the live deliverable directly on-chain using `gl.nondet.web.render`.
- **Subjective Consensus Court:** GenLayer validator nodes run decentralized LLM evaluations (`gl.vm.run_nondet`) comparing the live post against the brand's guidelines, computing consensus on compliance score and qualitative rationale.
- **Autonomous Payouts & Refunds:** Upon consensus, native tokens are dispatched automatically via `gl.get_contract_at(recipient).emit_transfer(value=...)`.
- **Creator Timeout Protection:** If a brand stalls and does not trigger review, creators can autonomously claim a 100% timeout payout once the review window expires.
- **Staked Dispute Appeal:** If either party contests the court outcome, they can stake a 20% appeal bond to escalate the case to a multi-validator appeal consensus.

---

## 📐 Architecture & Consensus Flow

```
+-----------------------------------------------------------------------------------+
|                                 ADSHIELD PRO ARCHITECTURE                         |
+-----------------------------------------------------------------------------------+
                                          |
  [ 1. Escrow Creation ]                  |  [ 2. Deliverable Submission ]
  Brand deposits GEN bounty               |  Creator submits post URL
  & specifies guidelines                  |  ==> Anti-Cancel Lock triggers!
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        GenVM Subjective Consensus Court                           |
|                                                                                   |
|  1. gl.nondet.web.render(url, mode="text")                                        |
|     -> Extracts live page text directly on-chain                                  |
|                                                                                   |
|  2. gl.vm.run_nondet(leader_fn, validator_fn)                                     |
|     -> Leader LLM prompts validator nodes with guidelines + evidence              |
|     -> Output: { verdict: "COMPLIANT"|"VIOLATED", score: 0-100, reason: "..." }   |
|     -> Independent validators vote on leader's verdict                            |
+-----------------------------------------------------------------------------------+
                                          |
                   +----------------------+----------------------+
                   |                                             |
            [ COMPLIANT ]                                  [ VIOLATED ]
                   |                                             |
                   v                                             v
  Creator receives 100% Payout                   Brand receives 100% Refund
  via gl.get_contract_at().emit_transfer()       via gl.get_contract_at().emit_transfer()
                   |                                             |
                   +----------------------+----------------------+
                                          |
                                          v
                         [ 3. Staked Dispute Appeal ]
                         Either party stakes 20% bond
                         to trigger appeal re-adjudication
```

---

## 🔒 Network Lock: GenLayer Studionet Only

AdShield Pro is strictly locked to **GenLayer Studionet**:

| Parameter | Specification |
| :--- | :--- |
| **Network Name** | GenLayer Studionet |
| **Chain ID** | `61999` (`0xF1EF`) |
| **JSON-RPC Endpoint** | `https://studio.genlayer.com/api` |
| **Native Currency** | `GEN` (18 Decimals) |
| **Block Explorer & Studio** | [https://studio.genlayer.com](https://studio.genlayer.com) |

> ⚠️ **MetaMask Integration:** The AdShield Pro frontend enforces automatic network switching to Chain ID `61999`. If a connected account has 0 GEN, a dedicated notification banner links users directly to the GenLayer Studio Accounts panel to claim test tokens.

---

## 💻 GenVM Smart Contract (`contracts/contract.py`)

The smart contract uses GenLayer's Python runtime (`genlayer.gl`):

### Key Storage Structures
- `Campaign`: Holds sponsor address, creator address, bounty amount, guidelines, platform, deliverable URL, status enum, verdict, reason, confidence, compliance score, and timestamps.
- `TreeMap[str, Campaign]`: On-chain map of all escrow campaigns indexed by ID (`ad-1`, `ad-2`, etc.).

### Contract Methods

| Method | Access / Type | Description |
| :--- | :--- | :--- |
| `create_campaign(guidelines, platform, timeout)` | `@gl.public.write.payable` | Brand locks escrow bounty and registers campaign. |
| `submit_content(campaign_id, deliverable_url)` | `@gl.public.write` | Creator submits deliverable; activates Anti-Cancel lock. |
| `adjudicate(campaign_id)` | `@gl.public.write` | Triggers on-chain web render and subjective LLM consensus court. |
| `claim_timeout_payout(campaign_id)` | `@gl.public.write` | Creator claims automatic payout if review window passes without adjudication. |
| `file_dispute_appeal(campaign_id)` | `@gl.public.write.payable` | Either party stakes 20% appeal bond to re-open adjudication. |
| `cancel_campaign(campaign_id)` | `@gl.public.write` | Brand cancels and recovers funds (only allowed while status is `OPEN`). |
| `get_campaign(campaign_id)` | `@gl.public.view` | Returns complete campaign record as JSON. |
| `get_stats()` | `@gl.public.view` | Returns total escrow locked, total campaigns, and settled campaigns. |
| `get_campaign_count()` | `@gl.public.view` | Returns count of campaigns deployed. |
| `get_campaign_id_by_index(index)` | `@gl.public.view` | Returns campaign ID at index for frontend iteration. |

---

## 🧪 Comprehensive Pytest Test Suite

AdShield Pro includes an automated Pytest test suite using `gltest` and persistent simulator mocks (`sim_installMocks`):

```bash
# Run the full test suite
python -m pytest tests/test_adshield.py -v -s
```

### Verified Test Cases (7/7 Passing):
1. `test_create_campaign`: Verifies brand locks funds, increments total escrow, and initializes `ad-1` in `OPEN` state.
2. `test_submit_content`: Verifies creator deliverable submission transitions campaign to `IN_REVIEW` and records creator address.
3. `test_anti_cancel_protection`: Verifies brand cannot cancel or withdraw funds once content is submitted.
4. `test_successful_adjudication_compliant`: Simulates valid content via bare-dict mocks, verifies LLM consensus reaches `COMPLIANT`, and creator receives payout.
5. `test_failed_adjudication_violated`: Simulates deleted/inaccessible URL, verifies LLM consensus reaches `VIOLATED`, and brand receives refund.
6. `test_claim_timeout_payout`: Verifies creator can claim 100% escrow payout if review window passes.
7. `test_file_dispute_appeal`: Verifies party can stake 20% appeal bond to escalate disputed campaign to `IN_APPEAL`.

---

## 🖥️ Web3 Frontend (React + Vite + TailwindCSS + `genlayer-js`)

The frontend is located in `frontend/` and provides a clean Web3 dApp:
- **Zero-Mock Policy:** Connects directly to GenLayer Studionet RPC and MetaMask.
- **Interactive Roles:**
  - **Brand Portal:** Create marketing campaigns, specify guidelines, lock escrow funds.
  - **Creator Portal:** Submit live content URLs, trigger subjective court review, claim timeout payouts.
  - **Court Inspector:** Open consensus audit reports with confidence scores, compliance breakdown, and qualitative rationale.
  - **Dispute Appeal:** Stake 20% appeal bonds to dispute outcomes.

### Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```

---

## 🚀 Deploying to GenLayer Studionet

1. Open [GenLayer Studio](https://studio.genlayer.com).
2. Connect your MetaMask wallet and switch to **GenLayer Studionet** (`Chain ID: 61999`).
3. Under the **Accounts** panel, ensure your wallet has test GEN tokens.
4. Navigate to the **Contracts** panel and create a new contract.
5. Paste the code from `contracts/contract.py`.
6. Click **Deploy**.
7. Copy the deployed contract address and paste it into the **Settings** modal in the AdShield Pro frontend.

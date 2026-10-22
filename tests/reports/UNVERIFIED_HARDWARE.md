# Unverified Hardware, Live Gateways & Physical Environment Report

In strict compliance with `AGENTS.md` ("Never assert hardware claims without real hardware; state the real-world test gate as **BLOCKED**, never passed. No fake metrics"), this report enumerates all components that require physical on-site deployment, external commercial credentials, or hardware validation.

---

## 1. Physical Hardware & Environmental Gates

| Component / Subsystem | Required Physical Resource | Simulation Status | Real-World Status | Release Gate Justification |
| :--- | :--- | :--- | :---: | :--- |
| **Physical Print Engines** | Real Xerox AltaLink, Canon imageRUNNER, HP LaserJet printers connected via USB/LAN | **PASSED** (Virtual Shop Lab: Printers 1-10 verified) | **BLOCKED (HARDWARE PENDING)** | Physical paper delivery, toner density, paper feed alignment, and actual tray pickup require on-site printer testing. |
| **Mechanical Paper Jams** | Real fuser roller jams, accordion folds, physical bin-full sensors | **PASSED** (Simulated via `COMPLETION_UNKNOWN` state machine) | **BLOCKED (HARDWARE PENDING)** | Real spoolers vary across vendor drivers (PCL6 vs PostScript vs GDI). Requires verification with physical print queue. |
| **TWAIN / WIA Document Scanners** | Physical flatbed and ADF document scanner hardware | **PASSED** (Synthetic image generation) | **BLOCKED (HARDWARE PENDING)** | TWAIN/WIA 32/64-bit DLL driver compatibility requires connected physical scanner. |
| **Self-Service Copier Coin-Op / Relay** | Microcontroller GPIO relays or card reader hardware | **PASSED** (Software lock/unlock session state machine) | **BLOCKED (HARDWARE PENDING)** | Hardware electrical interlocks must be certified for shop safety before commercial release. |
| **Physical Safari on iPhone** | Real physical iPhone device running iOS Safari WebKit | **PASSED** (Desktop Chrome/Firefox/WebKit emulated viewports) | **BLOCKED (DEVICE PENDING)** | Emulated WebKit does not replace physical iOS gesture handling and camera upload behaviors. |
| **Live Payment Settlement** | Real merchant UPI bank accounts and live Razorpay credentials | **PASSED** (Signed HMAC webhook simulation & idempotency store) | **BLOCKED (KYC PENDING)** | Real money movement requires merchant bank account onboarding, GSTIN verification, and live API keys. |
| **EV Code-Signing Certificate** | Hardware security token (YubiKey/HSM) with Microsoft Authenticode EV cert | **PASSED** (Unsigned dev builds verified in test mode) | **BLOCKED (CERTIFICATE PENDING)** | Commercial distribution without Windows SmartScreen warnings requires an EV Code Signing certificate from a trusted CA. |

---

## 2. Transition Plan from Simulator to Physical Pilot
1. **Phase 1 (Completed)**: 100% automated software verification in synthetic/simulated lab environment.
2. **Phase 2 (Pilot Readiness)**: Deploy desktop installer to shop test PC; connect USB/LAN to Xerox AltaLink C8170.
3. **Phase 3 (Physical Verification)**: Run controlled 10-page test prints (5 simplex, 5 duplex) and verify mechanical delivery.
4. **Phase 4 (Live Merchant Activation)**: Enter shop owner Razorpay live keys; test single ₹1 UPI transaction.

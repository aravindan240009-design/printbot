# Print Bot Distribution & SmartScreen Trust Guide

## Distribution Files (Ready in `d:\print bot\release\`)
- **`Print Bot_1.0.0_x64-setup.exe`**: The production NSIS installer (digitally signed with SHA256 Authenticode and DigiCert timestamping).
- **`PrintBot_Certificate.cer`**: The public certificate file for Print Bot Platform.
- **`Install-Certificate.bat`**: A 1-click script to install the certificate to the target PC's Trusted Root store.

---

## 1. Sharing with Friends & Shop Counters (Zero Cost, Immediate)

When sending `Print Bot_1.0.0_x64-setup.exe` to a friend or shop counter PC via WhatsApp, Telegram, Google Drive, or USB:

### Option A: Standard Windows 1-Click Bypass
Tell your friend or shop operator to:
1. Double click `Print Bot_1.0.0_x64-setup.exe`.
2. When the blue **"Windows protected your PC"** dialog appears, click **"More info"**.
3. Click **"Run anyway"**.
*(This only needs to be clicked once per PC).*

### Option B: 1-Click Trusted Certificate Installation
Send the `dist-certificates` or `release` folder:
1. Right-click **`Install-Certificate.bat`** and select **"Run as administrator"**.
2. Run `Print Bot_1.0.0_x64-setup.exe` — Windows will recognize **Print Bot Platform** as a trusted publisher and open without SmartScreen warning!

---

## 2. Wide Commercial Public Distribution (Worldwide Automatic Trust)

For mass consumer / public website distribution without any SmartScreen prompt on any Windows PC worldwide:

1. **Obtain an Authenticode Code Signing Certificate**:
   - Get an **EV (Extended Validation) Code Signing Certificate** or Standard Code Signing Certificate from a Microsoft-trusted Certificate Authority:
     - [DigiCert](https://www.digicert.com/signing/code-signing-certificates)
     - [Sectigo](https://sectigo.com/ssl-certificates-tls/code-signing)
     - [SSL.com](https://www.ssl.com/certificates/code-signing/)
     - [Certum](https://shop.certum.eu/open-source-code-signing.html)

2. **Plug your Certificate Thumbprint into Tauri**:
   Open `d:\print bot\apps\desktop\src-tauri\tauri.conf.json`:
   ```json
   "bundle": {
     "windows": {
       "certificateThumbprint": "YOUR_COMMERCIAL_CERTIFICATE_THUMBPRINT",
       "digestAlgorithm": "sha256",
       "timestampUrl": "http://timestamp.digicert.com"
     }
   }
   ```

3. **Rebuild**:
   Run in PowerShell:
   ```powershell
   .\scripts\build-and-sign.ps1 -Thumbprint "YOUR_COMMERCIAL_CERTIFICATE_THUMBPRINT"
   ```
   The installer will be signed with Microsoft worldwide trust.


export default class HardwareAccelerationPopup {
    
    constructor(onClosePopup) {
        this.onClosePopup = onClosePopup;
    }
    
    checkAndShowHardwareAccelWarning() {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2');
        
        if (!gl) {
            this.showHardwareAccelWarning();
            return false;
        }
        
        return true;
    }

    showHardwareAccelWarning() {
        const overlay = document.createElement('div');
        overlay.id = 'hardwareAccelWarning';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const popup = document.createElement('div');
        popup.style.cssText = `
            background: white;
            border: 2px solid black;
            padding: 20px;
            width: 500px;
            max-width: 90vw;
            font-family: Arial, sans-serif;
        `;
        
        popup.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                Something went wrong when we tried to load...
            </h3>
            <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
                It could be something else, but we think your hardware acceleration is turned off.
            </p>
            <div style="background: #f5f5f5; border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; font-size: 13px; line-height: 1.6;">
                <strong>Chrome / Edge:</strong><br>
                Settings → System → Enable "Use hardware acceleration"<br>
                Restart browser<br><br>
                
                <strong>Firefox:</strong><br>
                Settings → General → Performance<br>
                Uncheck "Use recommended settings"<br>
                Check "Use hardware acceleration"<br>
                Restart browser<br><br>
                
                <strong>Safari:</strong><br>
                Hardware acceleration enabled by default... (send me a email)
            </div>
            <button id="hwAccelOk" style="
                width: 100%;
                padding: 10px;
                background: white;
                border: 2px solid black;
                font-size: 14px;
                cursor: pointer;
                font-weight: bold;
            ">OK</button>
        `;
        
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        document.getElementById('hwAccelOk').addEventListener('click', () => {
            overlay.remove();
            this.onClosePopup();
        });
    }
}
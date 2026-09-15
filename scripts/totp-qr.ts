import { error } from 'console';
import QRCode from 'qrcode';


const otpAuthUrl = process.argv[2];

if(!otpAuthUrl){
    throw new Error('Pass otpUrl as argument')
}

const main = async () => {
    await QRCode.toFile('totp.png', otpAuthUrl);

    console.log('Saved QR code')
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
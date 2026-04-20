const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const secretKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

/**
 * @desc Encrypts sensitive data using AES-256-GCM for confidentiality and integrity
 */
exports.encrypt = (text) => {
    if(!text) return null;
    const initialisationVector = crypto.randomBytes(16); //Unique IV for each encryption to ensure security
    const cipher = crypto.createCipheriv(algorithm, secretKey, initialisationVector);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex'); //Authentication tag for integrity verification
    return `${initialisationVector.toString('hex')}:${encrypted}:${authTag}`; //Storing IV and auth tag with the ciphertext for decryption
};

/**
 * @desc Decrypts data encrypted with the above method, verifying integrity with the auth tag
 */
exports.decrypt = (encryptedData) => {
    if(!encryptedData) return null;
    const [initialisationVectorHex, encryptedText, authTagHex] = encryptedData.split(':');
    if(!initialisationVectorHex || !encryptedText || !authTagHex){
        throw new Error('Invalid encrypted data format');
    }
    const initialisationVector = Buffer.from(initialisationVectorHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, secretKey, initialisationVector);
    decipher.setAuthTag(authTag); //Setting the auth tag to verify integrity during decryption
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
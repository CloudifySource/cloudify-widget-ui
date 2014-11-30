/**
 * Created by sefi on 13/11/14.
 */
'use strict';

var crypto = require('crypto');

/**
 * @param encryptKey            The key to encrypt with
 * @param secret                The secret to be encrypted
 * @param algorithm             The algorithm to use for the encryption. If not specified, AES256 will be used.
 * @returns                     The encrypted secret in base64 format.
 */
exports.encrypt = function (encryptKey, secret, algorithm) {
    algorithm = algorithm || 'aes256';
    var cipher = crypto.createCipher(algorithm, encryptKey);
    return cipher.update(secret, 'binary', 'base64') + cipher.final('base64');
};

/**
 * @param decryptKey            The key to decrypt with
 * @param encryptedSecret       The encryptedSecret to be decrypted
 * @param algorithm             The algorithm to use for the decryption. If not specified, AES256 will be used.
 * @returns                     The decrypted secret
 */
exports.decrypt = function (decryptKey, encryptedSecret, algorithm) {
    algorithm = algorithm || 'aes256';
    var decipher = crypto.createDecipher(algorithm, decryptKey);
    return decipher.update(encryptedSecret, 'base64', 'binary') + decipher.final('binary');
};
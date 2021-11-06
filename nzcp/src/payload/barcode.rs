use std::str::FromStr;

use base32::Alphabet::RFC4648;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum QrBarcodeError {
    #[error("The payload of the QR Code MUST be base32 encoded")]
    InvalidBase32,
    #[error("The version-identifier portion of the payload for the specification MUST be 1")]
    InvalidVersion,
    #[error("The payload of the QR Code MUST begin with the prefix of `NZCP:/`")]
    MissingNzcpPrefix,
}

/// Expects a valid encoded pass from 2D barcode format encoded as:
/// `NZCP:/<version-identifier>/<base32-encoded-CWT>`
///
/// Holds the decoded CBOR bytes, which can then be deserialized.
///
/// Implements `FromStr`, so use as follows:
///
/// ```rust
/// let barcode: QrBarcode = "NZCP:/1/2KCEVIQ...".parse().unwrap();
/// ```
pub struct QrBarcode(pub Vec<u8>);

impl FromStr for QrBarcode {
    type Err = QrBarcodeError;

    fn from_str(string: &str) -> Result<Self, Self::Err> {
        use QrBarcodeError::*;

        let base32_encoded_cwt = string
            .strip_prefix("NZCP:/")
            .ok_or(MissingNzcpPrefix)?
            .strip_prefix("1/")
            .ok_or(InvalidVersion)?;

        let cbor_array = base32::decode(RFC4648 { padding: false }, base32_encoded_cwt).ok_or(InvalidBase32)?;
        Ok(QrBarcode(cbor_array))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fmt::Write;

    #[test]
    fn deserialize_barcode() {
        let encoded = "NZCP:/1/2KCEVIQEIVVWK6JNGEASNICZAEP2KALYDZSGSZB2O5SWEOTOPJRXALTDN53GSZBRHEXGQZLBNR2GQLTOPICRUYMBTIFAIGTUKBAAUYTWMOSGQQDDN5XHIZLYOSBHQJTIOR2HA4Z2F4XXO53XFZ3TGLTPOJTS6MRQGE4C6Y3SMVSGK3TUNFQWY4ZPOYYXQKTIOR2HA4Z2F4XW46TDOAXGG33WNFSDCOJONBSWC3DUNAXG46RPMNXW45DFPB2HGL3WGFTXMZLSONUW63TFGEXDALRQMR2HS4DFQJ2FMZLSNFTGSYLCNRSUG4TFMRSW45DJMFWG6UDVMJWGSY2DN53GSZCQMFZXG4LDOJSWIZLOORUWC3CTOVRGUZLDOSRWSZ3JOZSW4TTBNVSWISTBMNVWUZTBNVUWY6KOMFWWKZ2TOBQXE4TPO5RWI33CNIYTSNRQFUYDILJRGYDVAYFE6VGU4MCDGK7DHLLYWHVPUS2YIDJOA6Y524TD3AZRM263WTY2BE4DPKIF27WKF3UDNNVSVWRDYIYVJ65IRJJJ6Z25M2DO4YZLBHWFQGVQR5ZLIWEQJOZTS3IQ7JTNCFDX";

        let payload: QrBarcode = encoded.parse().unwrap();

        let mut hex_str = String::new();
        for byte in payload.0 {
            write!(&mut hex_str, "{:02x}", byte).unwrap();
        }

        assert_eq!(
            &hex_str,
            "d2844aa204456b65792d310126a059011fa501781e6469643a7765623a6e7a63702e636f76696431392e6865616c74682e6e7a051a61819a0a041a7450400a627663a46840636f6e7465787482782668747470733a2f2f7777772e77332e6f72672f323031382f63726564656e7469616c732f7631782a68747470733a2f2f6e7a63702e636f76696431392e6865616c74682e6e7a2f636f6e74657874732f76316776657273696f6e65312e302e306474797065827456657269666961626c6543726564656e7469616c6f5075626c6963436f766964506173737163726564656e7469616c5375626a656374a369676976656e4e616d65644a61636b6a66616d696c794e616d656753706172726f7763646f626a313936302d30342d3136075060a4f54d4e304332be33ad78b1eafa4b5840d2e07b1dd7263d833166bdbb4f1a093837a905d7eca2ee836b6b2ada23c23154fba88a529f675d6686ee632b09ec581ab08f72b458904bb3396d10fa66d11477"
        )
    }
}

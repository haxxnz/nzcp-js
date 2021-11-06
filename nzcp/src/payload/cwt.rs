use std::fmt;

use chrono::NaiveDateTime;
use serde::{
    de::{self, Visitor},
    Deserialize, Deserializer,
};
use uuid::Uuid;

use super::barcode::QrBarcode;

#[derive(Debug, Deserialize, PartialEq, Eq)]
pub struct CwtPayload<'a, T> {
    #[serde(rename = "cti")]
    cwt_token_id: Uuid,

    #[serde(borrow, rename = "iss")]
    issuer: DecentralizedIdentifier<'a>,

    #[serde(rename = "nbf", deserialize_with = "deserialize_numeric_date")]
    not_before: NaiveDateTime,

    #[serde(rename = "exp", deserialize_with = "deserialize_numeric_date")]
    expiry: NaiveDateTime,

    #[serde(borrow, rename = "vc")]
    verifiable_credential: VerifiableCredential<'a, T>,
}

impl<'a, T> CwtPayload<'a, T> {
    pub fn from_barcode(barcode: &'a QrBarcode) -> Result<Self, ()>
    where
        T: Deserialize<'a>,
    {
        let mut deserializer = serde_cbor::Deserializer::from_slice(&barcode.0);
        Ok(CwtPayload::deserialize(&mut deserializer).unwrap())
    }
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
struct VerifiableCredential<'a, T> {
    /// JSON-LD Context property for conformance to the W3C VC standard. This property MUST be present and its value MUST be an array of strings where the first value MUST equal https://www.w3.org/2018/credentials/v1.
    ///
    /// The following is an example including an additional JSON-LD context entry that defines the additional vocabulary specific to the New Zealand COVID Pass.
    /// ```
    /// ["https://www.w3.org/2018/credentials/v1", "https://nzcp.covid19.health.nz/contexts/v1"]
    /// ```
    #[serde(rename = "@context")]
    context: Vec<&'a str>,

    /// Type property for conformance to the W3C VC standard. This property MUST be present and its value MUST be an array of two string values, whose first element is VerifiableCredential and second element corresponds to one defined in the pass types section.
    ///
    /// Example
    /// ```
    /// ["VerifiableCredential", "PublicCovidPass"]
    /// ```
    #[serde(rename = "type")]
    _type: (&'a str, &'a str),

    /// Version property of the New Zealand Covid Pass. This property MUST be present and its value MUST be a string who’s value corresponds to a valid version identifier as defined by semver. For the purposes of this version of the specification this value MUST be 1.0.0.
    version: &'a str,

    /// Credential Subject property MUST be present and its value MUST be a JSON object with properties determined by the declared pass type for the pass.
    #[serde(rename = "credentialSubject")]
    credential_subject: T,
}

fn deserialize_numeric_date<'de, D>(deserializer: D) -> Result<NaiveDateTime, D::Error>
where
    D: Deserializer<'de>,
{
    let epoch_seconds = i64::deserialize(deserializer)?;
    Ok(NaiveDateTime::from_timestamp(epoch_seconds, 0))
}

#[derive(Debug, PartialEq, Eq)]
enum DecentralizedIdentifier<'a> {
    Web(&'a str),
}

struct DecentralizedIdentifierVisitor;

impl<'de> Visitor<'de> for DecentralizedIdentifierVisitor {
    type Value = DecentralizedIdentifier<'de>;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter
            .write_str("a Decentralized Identifier who’s DID Method MUST correspond to web (starting with 'did:web:')")
    }

    fn visit_borrowed_str<E>(self, string: &'de str) -> Result<Self::Value, E>
    where
        E: de::Error,
    {
        if let Some(identifier) = string.strip_prefix("did:web:") {
            Ok(DecentralizedIdentifier::Web(identifier))
        } else {
            Err(E::custom("invalid DID"))
        }
    }
}

impl<'de: 'a, 'a> Deserialize<'de> for DecentralizedIdentifier<'a> {
    fn deserialize<D>(deserializer: D) -> Result<DecentralizedIdentifier<'a>, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(DecentralizedIdentifierVisitor)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserialize_json() {
        let json = r#"{
            "iss": "did:web:example.nz",
            "nbf": 1516239022,
            "exp": 1516239922,
            "cti": "urn:uuid:cc599d04-0d51-4f7e-8ef5-d7b5f8461c5f",
            "vc": {
                "@context": [ "https://www.w3.org/2018/credentials/v1", "https://nzcp.covid19.health.nz/contexts/v1" ],
                "version": "1.0.0",
                "type": [ "VerifiableCredential", "PublicCovidPass" ],
                "credentialSubject": "helloworld"
            }
        }"#;

        let payload: CwtPayload<String> = serde_json::from_str(json).unwrap();
        assert_eq!(
            payload,
            CwtPayload {
                cwt_token_id: Uuid::parse_str("urn:uuid:cc599d04-0d51-4f7e-8ef5-d7b5f8461c5f").unwrap(),
                issuer: DecentralizedIdentifier::Web("example.nz"),
                not_before: NaiveDateTime::from_timestamp(1516239022, 0),
                expiry: NaiveDateTime::from_timestamp(1516239922, 0),
                verifiable_credential: VerifiableCredential {
                    context: vec![
                        "https://www.w3.org/2018/credentials/v1",
                        "https://nzcp.covid19.health.nz/contexts/v1"
                    ],
                    _type: ("VerifiableCredential", "PublicCovidPass"),
                    version: "1.0.0",
                    credential_subject: String::from("helloworld"),
                }
            }
        )
    }
}

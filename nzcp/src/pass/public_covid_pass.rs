use chrono::NaiveDate;
use serde::{de::Error, Deserialize, Deserializer};

use super::Pass;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum PublicCovidPassError {
    #[error("The given date of birth was invalid.")]
    InvalidDateOfBirth,
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
struct PublicCovidPass<'a> {
    /// Given name(s) of the subject of the pass.
    #[serde(rename = "givenName")]
    given_name: &'a str,

    /// Family name(s) of the subject of the pass.
    #[serde(rename = "familyName")]
    family_name: &'a str,

    #[serde(rename = "dob", deserialize_with = "deserialize_iso_8601_date")]
    date_of_birth: NaiveDate,
}

impl<'a> Pass for PublicCovidPass<'a> {
    const CREDENTIAL_TYPE: &'static str = "PublicCovidPass";
}

fn deserialize_iso_8601_date<'de, D>(deserializer: D) -> Result<NaiveDate, D::Error>
where
    D: Deserializer<'de>,
{
    let string: &str = Deserialize::deserialize(deserializer)?;
    NaiveDate::parse_from_str(string, "%Y-%m-%d")
        .map_err(|_| D::Error::custom(PublicCovidPassError::InvalidDateOfBirth))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserialize_json() {
        let json = r#"{
            "givenName": "John Andrew",
            "familyName": "Doe",
            "dob": "1979-04-14"
        }"#;

        let payload: PublicCovidPass = serde_json::from_str(json).unwrap();
        assert_eq!(
            payload,
            PublicCovidPass {
                given_name: "John Andrew",
                family_name: "Doe",
                date_of_birth: NaiveDate::from_ymd(1979, 04, 14),
            }
        )
    }
}

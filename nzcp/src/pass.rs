pub mod public_covid_pass;

pub trait Pass {
    /// The type ID of the pass, given in `vc.type[1]`. (e.g. 'PublicCovidPass')
    const CREDENTIAL_TYPE: &'static str;
}

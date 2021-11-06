use thiserror::Error;

use crate::payload::barcode::QrBarcodeError;

#[derive(Debug, Error)]
pub enum NzcpError {
    #[error("Invalid QR barcode: {0:?}")]
    QrBarcode(QrBarcodeError),
}

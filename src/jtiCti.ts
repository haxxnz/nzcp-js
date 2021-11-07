import { JTIResult } from "./generalTypes";

// Section 2.1.1
// Decode CTI to JTI. Conforms to RFC4122
// https://nzcp.covid19.health.nz/#mapping-jti-cti
export function decodeCtiToJti(rawCti: Buffer): JTIResult {
  // Section 2.1.1.10.1
  // Parse the 16 byte value and convert to hexadecimal form
  if (rawCti.length !== 16) {
    return {
      success: false,
      violates: {
        message: `CTI must be 16 octets, but was ${rawCti.length} octets.`,
        section: "RFC4122.4.1",
        link: "https://datatracker.ietf.org/doc/html/rfc4122#section-4.1",
      },
      jti: null,
    };
  }
  const hexUuid = rawCti.toString("hex");

  // Section 2.1.1.10.2
  // In accordance with the ABNF syntax defined by [RFC4122] split the resulting hexadecimal string along the 4-2-2-2-6 hex octet pattern.
  // https://datatracker.ietf.org/doc/html/rfc4122#section-3
  // The formal definition of the UUID string representation is
  // provided by the following ABNF [7]:
  //
  // UUID                   = time-low "-" time-mid "-"
  //                          time-high-and-version "-"
  //                          clock-seq-and-reserved
  //                          clock-seq-low "-" node
  // time-low               = 4hexOctet
  // time-mid               = 2hexOctet
  // time-high-and-version  = 2hexOctet
  // clock-seq-and-reserved = hexOctet
  // clock-seq-low          = hexOctet
  // node                   = 6hexOctet
  // hexOctet               = hexDigit hexDigit
  // hexDigit =
  //       "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" /
  //       "a" / "b" / "c" / "d" / "e" / "f" /
  //       "A" / "B" / "C" / "D" / "E" / "F"
  const timeLow = hexUuid.slice(0, 8);
  const timeMid = hexUuid.slice(8, 12);
  const timeHighAndVersion = hexUuid.slice(12, 16);
  const clockSeqAndReserved = hexUuid.slice(16, 18);
  const clockSeqLow = hexUuid.slice(18, 20);
  const node = hexUuid.slice(20, 32);
  const uuid = `${timeLow}-${timeMid}-${timeHighAndVersion}-${clockSeqAndReserved}${clockSeqLow}-${node}`;

  // Section 2.1.1.10.3
  // Prepend the prefix of urn:uuid to the result obtained
  const jti = `urn:uuid:${uuid}`;
  return { success: true, violates: null, jti };
}

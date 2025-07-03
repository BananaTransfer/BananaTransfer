# Business Requirements

## BR1 – Sécurité des échanges
BananaTransfer must allow users to transfer files securely, without third parties (including server administrators) being able to read the contents of shared files.

## BR2 – End-to-end encryption (E2EE)
The system must guarantee only the sender and recipient can read the messages, ensuring that no one else, including the service provider, can access the content during transit.

## BR3 – Sensitive information security
No sensitive information (e.g. cryptographic keys or personal information) should be stored unencrypted on the servers.

## BR4 – Server interoperability
BananaTransfer must function in a decentralized manner. Users can share files between BananaTransfer-compatible servers, without a need for a centralized server or storage infrastructure.

## BR5 – Traceability
The system must keep a trace of the cryptographic key changes to avoid man-in-the-middle attacks.

## BR6 – User-friendliness
The application must be easily usable by non-technical audiences, with a simple interface to send and receive files.

## BR7 – Portability and self-hosting ability
Organizations should be able to setup their own BananaTransfer server, with standard deployment tools.

## BR8 – Security best practices
The project must implement widely used standards in terms of security.

## BR9 – Open-source development
The project must be developed by the means of open-source collaboration, with collaboration tools for code and documentation (GitHub).




# User Requirements

## UR1 – Account creation
Users must be able to create an account on a BananaTransfer server using a username and password.

## UR2 – Key generation
Users must be able to generate a public/private keypair directly in their browser, without exposing their private key to the server.

## UR3 – Secure private key handling
Users must encrypt their private key in the browser using a randomly generated 64-character string and store that string securely in their own password vault. The server only stores the encrypted private key and public key.

## UR4 – Login with password
Users must be able to log in using only their username and password. The 64-character key is only needed later to decrypt their private key.

## UR5 – File upload
Users must be able to upload a file, which is encrypted in the browser before being sent to the server.

## UR6 – File sharing to other users
Users must be able to share a file with another user by entering their BananaTransfer address (e.g., `username@organization.com`). The recipient's public key must be automatically fetched from their server.

## UR7 – Encrypted file transfer
The user’s browser must encrypt the file with a symmetric key, then encrypt that key using the recipient’s public key. This ensures only the recipient can decrypt it.

## UR8 – File listing (Inbox)
Users must be able to view a list of received files (inbox), including metadata like sender and file name.

## UR9 – File retrieval and decryption
Users must be able to retrieve a received file and decrypt it in the browser by:
- UR9.1 Downloading their encrypted private key
- UR9.2 Entering their 64-character key to decrypt the private key
- UR9.3 Using the private key to decrypt the symmetric key
- UR9.4 Using the symmetric key to decrypt the file

## UR10 – File deletion (before retrieval)
Senders must be able to delete files they uploaded, provided the file has not yet been retrieved by the recipient.

## UR11 – Key rotation
Users must be able to rotate their keypair. This will delete the old private key and all files previously encrypted with it.

## UR12 – Password change
Users must be able to change their login password at any time.

## UR13 – Storage usage
Users must be informed if they are approaching their storage quota, as defined by their server administrator.

## UR14 – Cross-server sharing
Users must be able to receive files from users hosted on other BananaTransfer-compatible servers.

## UR15 – Server notification
Users must be notified (in-app or via their inbox UI) when a new file is available for retrieval from another server.

## UR16 – Storage quota management by administrators
Server administrators must be able to define and enforce a maximum storage limit per user account on their server.




# System Requirements

## SR1 – User Management

- **SR1.1** The system SHALL allow user registration with a unique username in the format `username@domain_of_server` and a password.
- **SR1.2** The system SHALL allow users to log in using their registered credentials (username and password).
- **SR1.3** The system SHALL allow users to change their password at any time after authentication.
- **SR1.4** The system SHALL allow users to generate an asymmetric key pair (public/private) client-side.
  - **SR1.4.1** The private key SHALL be encrypted in the browser using a randomly generated 64-character passphrase.
  - **SR1.4.2** The passphrase SHALL never be sent to or stored by the server.
- **SR1.5** The system SHALL store the public key and encrypted private key on the user’s organization server.
- **SR1.6** The system SHALL allow users to rotate their keypair.
  - **SR1.6.1** Key rotation SHALL delete the existing private key on the server.
  - **SR1.6.2** Files encrypted for the previous key SHALL become irretrievable after rotation.

## SR2 – Key Management and Federation

- **SR2.1** The system SHALL allow a sender’s server to fetch a recipient’s public key from a remote server.
- **SR2.2** The system SHALL store a hash of fetched public keys to detect if they change later.
- **SR2.3** The system SHALL expose a public endpoint to retrieve public keys by username for federation purposes.

## SR3 – File Upload and Sharing

- **SR3.1** The system SHALL allow users to upload files only after encryption in the browser.
  - **SR3.1.1** Files SHALL be encrypted using a symmetric key generated client-side.
  - **SR3.1.2** The symmetric key SHALL be encrypted with the recipient’s public key before upload.
- **SR3.2** The encrypted file SHALL be uploaded to the sender’s file storage server (e.g., S3).
- **SR3.3** The sender's server SHALL notify the recipient's server of the availability of the new file.
- **SR3.4** The system SHALL allow the sender to delete an uploaded file if it has not yet been retrieved.

## SR4 – File Retrieval and Decryption

- **SR4.1** The recipient's server SHALL allow fetching the encrypted file from the sender's server upon user request.
- **SR4.2** The system SHALL allow users to list available files in their inbox.
- **SR4.3** The system SHALL support decryption of files entirely within the browser:
  - **SR4.3.1** The browser SHALL fetch the encrypted file and encrypted private key from the server.
  - **SR4.3.2** The browser SHALL prompt the user to input their 64-character passphrase.
  - **SR4.3.3** The private key SHALL be decrypted using the passphrase client-side.
  - **SR4.3.4** The symmetric key SHALL be decrypted with the private key.
  - **SR4.3.5** The file SHALL be decrypted using the symmetric key.
  - **SR4.3.6** The decrypted file and unencrypted private key SHALL never be transmitted to the server.

## SR5 – Storage and Quota Management

- **SR5.1** The system SHALL allow the server administrator to define a maximum storage quota per user.
- **SR5.2** The system SHALL deny uploads that would exceed a user’s quota and return a meaningful error.

## SR6 – Security and Cryptographic Constraints

- **SR6.1** All cryptographic operations involving private keys and file content SHALL be executed in the browser.
- **SR6.2** The system SHALL ensure that private keys, passphrases, symmetric keys, and decrypted file contents are never accessible to the server.

## SR7 – Key Trust and History Management

- **SR7.1** The system SHALL allow users to receive transfers from users they do not explicitly trust or know.
- **SR7.2** The system SHALL allow different users to associate trust with the same user identifier (e.g., `alice@server`) but with different public key hashes.
- **SR7.3** When a local user rotates their keypair, the newly generated public key hash SHALL replace the previously owned one.
  - **SR7.3.1** The previous key hash SHALL be retained until it is no longer referenced by any transfer or user association.

## SR8 – Transfer Lifecycle Management

- **SR8.1** When the sender is local and the recipient is remote:
  - **SR8.1.1** Upon initiation, the transfer SHALL be created in the database with status `PENDING_RETRIEVAL`.
  - **SR8.1.2** Upon confirmation that the file was successfully retrieved by the recipient server, the status SHALL be updated to `RETRIEVED` and the file shall be deleted from storage.
  - **SR8.1.3** If the sender deletes the transfer at any point, the transfer record SHALL be deleted from the database.

- **SR8.2** When the sender is remote and the recipient is local:
  - **SR8.2.1** Upon notification of a new file, the transfer SHALL be created in the local database with status `PENDING_RETRIEVAL`.
  - **SR8.2.2** Upon successful retrieval of the file from the sender server, the status SHALL be updated to `RETRIEVED`.
  - **SR8.2.3** If retrieval fails, the status SHALL remain `PENDING_RETRIEVAL`.
  - **SR8.2.4** If the recipient deletes the transfer, the record SHALL be removed from the database.

- **SR8.3** When both the sender and recipient are local:
  - **SR8.3.1** The system SHALL support transfer deletion behavior such that a transfer is deleted only when both the sender and recipient no longer retain access to it.
  - **SR8.3.2** The system SHALL define and document the conditions under which a transfer becomes orphaned and eligible for deletion.

## SR9 – Integrity Constraints

- **SR9.1** Each public key hash SHALL be either:
  - **SR9.1.1** Owned by a local user; or
  - **SR9.1.2** Associated with a known remote user.

- **SR9.2** A user SHALL be either local (managed by the current server) or remote (from a federated server), but not both.

- **SR9.3** A transfer SHALL be associated with at least one owned public key hash at all times.

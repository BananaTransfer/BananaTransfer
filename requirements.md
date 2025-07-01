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

# Database

## Schema

![database_schema.png](umls/dist/database_schema.png)

### Definitions

* local transfer: transfer from one local user to another
* orphaned row: row not referenced from anywhere 

### key considerations

* a user may receive a transfer from another user they don't know or trust yet.
* a user may trust another user, but not with the same associated public key.
* when a local user rotate it's keys, the hash of the public key changes, changed but the previous one is kept until orphaned.
* in the TransferLog table, the history and logs of a transfer are saved to be able to track the transfer and its status.

#### TransferStatus descriptions

* CREATED: Sender created the transfer but didn't already uploaded the file yet
* UPLOADED: Sender created the transfer and uploaded the file to their server but didn't already sent it / notified remote server about it
* SENT: Sender notified recipient server about file but transfer wasn't accepted yet by recipient
* ACCEPTED: Recipient accepted the transfer, but didn't fetch the file yet
* RETRIEVED: Status of the transfer when recipient accepted the transfer and fetched the file
* DELETED: File was deleted by sender or recipient
* REFUSED: Transfer was refused by recipient
* EXPIRED: Transfer has expired, f.ex. because recipient has changed its keys

### TransferStatus rules

* if the fetch from remote server fails, when the file is in the status PENDING, the status stays the same.
* if the recipient tries to fetch the file but the sender already has deleted it the recipient server updated the status to DELETED too.
* it is only possible to delete a transfer in the status CREATED and PENDING. If the transfer is already received by the other server it isn't possible.
* if the transfer is on one server locally from one user to another, the transfer can be deleted by both users at any time

### required integrity constraint

* a user can either be local or remote
* a transfer is associated to one sender and recipient, at least one of them must be local user

# Database

## Schema

![database_schema.png](umls/dist/database_schema.png)

### Definitions
* local transfer: transfer from one local user to another
* orphaned row: row not referenced from anywhere 

### key considerations
* a user may receive a transfer from another user he doesn't know or trust yet.
* various user may trust another user, but not with the same associated public key.
* when a local user rotate it's keys, the owned public key hash is changed but the previous one is kept until orphaned 

### required integrity constraint
* a public key hash must at least be owned by a local user or associated with a user
* a user can either be local or remote
* a transfer must be associated to at least one owned public key hash at all time

### remaining interrogation
* how to handle local transfer correctly
  * who incur the size of the file in it's storage limit
  * how to handle the case when one user delete the transfer but not the other


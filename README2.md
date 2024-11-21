## Backend

The API functions have been developed (testable via Insomnia) following the provided Swagger. These functions can be found in `tars/space/views.py`, along with the corresponding URLs in `tars/space/urls.py`. The correct functions were differentiated from those in testing because the Swagger did not provide enough information to implement them correctly; also, everything is well-commented.

## Frontend

The implementations of these functions in the frontend can be found in the `space/src/app` folder. However, difficulties arose in data management because many variables were initialized to interact with CouchDB, and deleting them created further errors that, given the limited time available and the lack of knowledge about the folder organization, were difficult to fix. Currently, it is possible to easily access both the Tars and Space servers by following the respective README files in each folder. However, in the latter case, the management of deliverables is not yet complete.

## Database

The interaction with the new PostgreSQL database has not yet been started, and it needs to replace all CouchDB logic.

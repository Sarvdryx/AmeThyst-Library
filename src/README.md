# I. Run the Program

When you clone the repository into your local drive, you are in the branch `main`. You must use `git checkout` to switch to the branch `dev` and start development from there.

```bash
git checkout dev
```

For future development, you should create your own feature branch from the `dev` branch (not from `main`). The branch name should be descriptive, such as `YourName_Feature` (e.g., `Minh_Authentication`).

```bash
git checkout -b Minh_Authentication
```

The `main` branch is only merged from the `dev` branch when all features are completed and the project is ready for production deployment.

---

## II. Project Setup

The project consists of three main parts:

* Frontend (`src/client`)
* Backend (`src/server`)
* Database (`src/database`)

### 1. Frontend Setup

Navigate to the client folder:

```bash
cd src/client
```

Copy the provided `.env.local` file into the `src/client` directory.

Example structure:

```text
src/
└── client/
    ├── .env.local
    ├── package.json
    └── ...
```

Install dependencies:

```bash
npm install
```

Start the frontend server:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

---

### 2. Backend Setup

Open a new terminal and navigate to the server folder:

```bash
cd src/server
```

Copy the provided `.env` file into the `src/server` directory.

Example structure:

```text
src/
└── server/
    ├── .env
    ├── package.json
    └── ...
```

Install dependencies:

```bash
npm install
```

Start the backend server:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

---

### 3. Database Setup

Navigate to the database folder:

```bash
cd src/database
```

Copy the provided `.env` file into:

```text
src/database/.env
```

Download the `init_db` package from the shared Google Drive and place the three SQL files into:

```text
src/database/init_db/postgres/
```

The folder structure should look similar to:

```text
src/
└── database/
    ├── .env
    ├── docker-compose.yml
    └── init_db/
        └── postgres/
            ├── 01_schema.sql
            ├── 02_seed.sql
            └── 03_data.sql
```

After placing all SQL files correctly, start the database containers:

```bash
docker-compose up
```

Or run in detached mode:

```bash
docker-compose up -d
```

You can verify that the containers are running:

```bash
docker ps
```

---

## III. Running the Entire System

Open three separate terminals (or use split terminals).

### Terminal 1 – Database

```bash
cd src/database
docker-compose up
```

### Terminal 2 – Backend

```bash
cd src/server
npm install
npm run dev
```

### Terminal 3 – Frontend

```bash
cd src/client
npm install
npm run dev
```

After all services start successfully:

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Database    | Docker Container      |

The application should now be fully operational through:

```text
http://localhost:3000
```

---

## IV. Running Tests & Scenario Filtering

The backend contains a full test suite built with Vitest. Tests are organized into **projects** (one project per feature) and annotated with **scenario tags** (`@A_R1` to `@A_R10`, etc.) mapping to unified business requirements.

All commands below are run from the `src/server` directory:

```bash
cd src/server
```

### Run the Entire Test Suite (all projects)
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Vitest UI (all projects)
```bash
npm run test:ui
```

### Run Tests for a Feature Group (project)
Each feature (e.g. Registration, Login) lives in its own Vitest **project**, named with a shared prefix so it can be run individually or as a group.

```bash
# Run every project under the "auth" feature group
# (currently: test_auth_register — more will be added, e.g. test_auth_login)
npm run test:auth

# Run only the Registration project
npm run test:auth:register

# Watch mode / UI, scoped to the auth group or a single project
npm run test:auth:watch
npm run test:auth:ui
npm run test:auth:register:watch
npm run test:auth:register:ui
```

> `test:auth` uses the wildcard `--project "test_auth*"`, so it automatically picks up every current and future project whose name starts with `test_auth` (e.g. `test_auth_register`, `test_auth_login`) without needing script changes.

### Run Scenario-Filtered Tests (by tag)
Use the `--tags-filter` CLI option to run tests by business scenario tag, scoped to the auth group:

```bash
# Run only tests validating Successful End-to-End Registration (Scenario 1)
npm run test:auth:tag -- "@A_R1"

# Run tests covering both Scenario 1 and Scenario 10
npm run test:auth:tag -- "@A_R1 and @A_R10"

# Equivalent, calling Vitest directly
npx vitest run --project "test_auth*" --tags-filter=@A_R1
```

### List Registered Tags
```bash
npx vitest run --list-tags
```

For the full scenario mapping matrix, tagging guidelines, and conventions, refer to the [Test Documentation](docs/test/index.md).

---

# II. Introduct to Server Structure
## 1. Server.mjs
This is the entry point of all system. It combines all components and starts the server instance by calling `app.listen()`
## 2. config/
This directory holds configuration files for third-party services and system settings.
```javascript
//In the file db.config.mjs belonging to config folder
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
    //...
};
export default connectDB;
```
## 3. controllers/
This folder acts as the bridge between requests and responses. It contains file that receives the request from the routes, extracts data (params, body), calls the relevant service, and returns the final response (JSON) to the client.
```javascript
//In the library.controller.mjs belonging to controllers folder
var borrowBook = (req, res) {
    //... Using the service functions
}
export {borrowBook};
```
## 4. middlewares/
These are interceptor functions that run during the request-response cycle. To perform security checks, data validation, or logging before a request reaches the controller.
```javascript
//In auth.middleware.mjs belonging to middlewares folder
const loginCheck = (req, res) => {
    //... Check Algorithm
}
//In role.middleware.mjs belonging to middlewares folder
const isCustomer = (req, res) => {
    //... Check Algorithm
}
```
Thanks to middleware function from `middlewares` folder, the request handler can become abstract as shown below:
```javascript
route.post('/library', loginCheck, isCustomer, borrowBook);
```
## 5. models/
This directory defines the "blueprint" of your data. It contains files that defines the schema for your database (e.g., fields, data types, and relationships). It ensures that data stored in your database is consistent and valid.
```javascript
// Consider book.model.mjs contains the schema to configure the book database
    const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true, unique: true },
    stock: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }}, 
    { timestamps: true });
```
## 6. routes/
This acts as the navigation system for your API. It contains files that defines which URL path maps to which controller function and which middlewares to execute first. It keeps your endpoints organized by resource.
```javascript
//In user.mjs belonging to routes folder
const route = Router()
route.get('/user', loginCheck, renderProfile);
route.post('/user', loginCheck, isCustomer, editProfile);
//... other activities in the user page
export default route;
```
## 7. services/
This is the "engine room" of your application. It contains the core business logic (e.g., calculating fines, complex database transactions, or coordinating multiple models). It allows you to keep your controllers lean and reusable.
```javascript
//In book.service.mjs belonging to services folder
const inStock = (parameters) => {
    //...Check Algorithm
}
const borrowLimit = (parameters) => {
    //...Check Algorithm
}
// Functions that can be called by middlewares and controller to make them become more abstract.
export {inStock, borrowLimit,...};
```
## 8.utils/
The utils folder is a place containing the reusable, support functions and they do not depend on the logic of system.
```javascript
//Consider matrix.util.mjs for processing QR code 
function rowEchelonForm(matrix){
    //... Convert Algorithm
}
function multiplyMatrix(matrixA, matrixB){
    //... Multiply Algorithm
}
function determinant(matrix){
    //... Calculate Algorithm
}
//... Relevant functions
export {rowEchelonForm, multiplyMatrix, determinant};
```
# III. Introduct to Client Structure
- React apps are made out of **components**
- A **components** can be as small as a button, or as large as entire page
- React components are Java Script functions that return markup
- **React components names** must always start with **capital letter**, while **HTML tags** must be **lowercase**
-  The markup syntax, returned in those functions, is called JSX - most React projects use JSX for its convenience.
## 1. app/
Folder `app` contains markup code of the web GUI.
## 2. components/
Folder `components` contains the components of the certain page.
```
//Example of structure of components folder
components
 |____NavBar
 |____PointerPage
 |____...
```
## 3. Creating new endpoints
You can consider ` http://localhost:3000` as `/` - the root or starting page.
By creating new folder in the `app` folder, the new endpoint is also created. For example, you create a folder named `library`, the new endpoint `/library` is created leading to the page `/library` if there is the `page.js` file in `library` folder.
You can create more deep endpoint, by creating folder named `book` in `library` folder --> `/librart/book`.
## 4. Naming file rule
The file must be followed the naming rule required by React NextJs. If not following these, the render mechanism can not perform.
- page.js: containing the markup code of the corresponding page
- layout.js: containing the markup code for the layout of corresponding page.
- not-found.js: containing markup code of the page rendered when the error 404 - Not Found appears
- others: you can find more naming convention in [NextJs File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
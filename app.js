// Globals
let gridApi;
var domo = window.domo;
var datasets = window.datasets;
var $ = window.jQuery;
var myDiv = document.getElementById("myDiv");
var listDataSetQuery = `/domo/datasources/v1?limit=10`;
var typingTimer;
var typingTimernew;
const doneTypingInterval = 800;
const doneTypingIntervalnew = 800;
let oldID = null;
let newID = null;

// ------------------------------------------------------ Initialize App --------------------------------------------------
loadDataSets();
setupTypeSearch();
setupTypeSearchnew();
resetModal();
checkSchemas(oldID, newID);

// ------------------------------------------------------ Load Data --------------------------------------------------
function loadDataSets(nameLike = undefined) {
  var listQuery = listDataSetQuery;
  if (nameLike !== undefined) {
    listQuery += `&nameLike=${nameLike}`;
  }

  domo
    .get(listQuery)
    .then(handleDataSetList)
    .catch(function () {
      handleDataSetList({ dataSources: [] });
      // todo: display error message
    });
}

function handleDataSetList(data) {
  const dataSetList = data["dataSources"];
  const filteredDataSetList = filterDataSetList(dataSetList);
  const tableElement = buildInitialDataSetListTable(filteredDataSetList);
  const tableElementnew = buildInitialDataSetListTablenew(filteredDataSetList);
  // Append the table to a container element in the HTML body
  const container = document.getElementById("tableContainer");
  const containernew = document.getElementById("tableContainernew");
  container.innerHTML = tableElement;
  containernew.innerHTML = tableElementnew;
}

function filterDataSetList(dataSetList) {
  return dataSetList.filter((record) => record.columnCount !== 0);
}

// ------------------------------------------------------ Build Modal Tables --------------------------------------------------
function buildInitialDataSetListTable(data) {
  // Create the table header
  const headers = ["Dataset", "Owner", ""];

  const headerRow = `<tr>${headers
    .map((header) => {
      var className =
        header === "Rows" || header === "Columns" ? "number" : "text";
      return `<th class="${className}">${header}</th>`;
    })
    .join("")}</tr>`;
  const thead = `<thead>${headerRow}</thead>`;

  // Create the table body
  const tbody = data
    .map(
      (item) => `
      <tr>
        <td><a href="javascript:domo.navigate('/datasources/${safelyGetID(
          item.id
        )}/details/overview', true)" class="link">${makeSafeText(
        item.name
      )}</a></td>
        <td>
          ${makeSafeText(item.owner.name)}
        </td>
        <td class="actions"><button onclick="modalButtonClickCallback(this, 'oldModal')" class="modal-button btn btn-outline-dark" data-bs-target="#exampleModalToggle" data-bs-toggle="modal" data-dataset-name="${makeSafeText(
          item.name
        )}" data-dataset-id="${safelyGetID(
        item.id
      )}" class="close" data-dismiss="modal" aria-label="Close">Select Dataset</button></td>
      </tr>
    `
    )
    .join("");

  // Create the table element
  const table = `
      <table class="table">
        ${thead}
        <tbody>${tbody}</tbody>
      </table>
    `;

  return table;
}

function buildInitialDataSetListTablenew(data) {
  // Create the table header
  const headers = ["Dataset", "Owner", ""];

  const headerRow = `<tr>${headers
    .map((header) => {
      var className =
        header === "Rows" || header === "Columns" ? "number" : "text";
      return `<th class="${className}">${header}</th>`;
    })
    .join("")}</tr>`;
  const thead = `<thead>${headerRow}</thead>`;

  // Create the table body
  const tbody = data
    .map(
      (item) => `
      <tr>
        <td><a href="javascript:domo.navigate('/datasources/${safelyGetID(
          item.id
        )}/details/overview', true)" class="link">${makeSafeText(
        item.name
      )}</a></td>
        <td>
          ${makeSafeText(item.owner.name)}
        </td>
        <td class="actions"><button onclick="modalButtonClickCallback(this, 'newModal')" class="modal-button btn btn-outline-dark" data-bs-target="#exampleModalToggle" data-bs-toggle="modal" data-dataset-name="${makeSafeText(
          item.name
        )}" data-dataset-id="${safelyGetID(
        item.id
      )}" class="close" data-dismiss="modal" aria-label="Close">Select Dataset</button></td>
      </tr>
    `
    )
    .join("");

  // Create the table element
  const table = `
      <table class="table">
        ${thead}
        <tbody>${tbody}</tbody>
      </table>
    `;

  return table;
}
// ------------------------------------------------------ Live Query Typing --------------------------------------------------
function setupTypeSearch() {
  // Event listener for the search input
  document.getElementById("searchInput").addEventListener("input", function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
  });
}
function setupTypeSearchnew() {
  // Event listener for the search input
  document
    .getElementById("searchInputnew")
    .addEventListener("input", function () {
      clearTimeout(typingTimernew);
      typingTimernew = setTimeout(doneTypingnew, doneTypingIntervalnew);
    });
}

// Callback function that runs when the user pauses typing
function doneTyping() {
  var searchValue = document.getElementById("searchInput").value;
  // Call your callback function or perform desired action here
  loadDataSets(searchValue);
}
function doneTypingnew() {
  var searchValuenew = document.getElementById("searchInputnew").value;
  // Call your callback function or perform desired action here
  loadDataSets(searchValuenew);
}

// ------------------------------------------------------ Build Form --------------------------------------------------
function resetModal() {}

function modalButtonClickCallback(button, modalType) {
  // Retrieve the dataset name and ID from the clicked button's data attributes
  const datasetName = button.getAttribute("data-dataset-name");
  const datasetId = button.getAttribute("data-dataset-id");

  // Assign dataset ID to the appropriate global variable based on modalType
  if (modalType === "oldModal") {
    oldID = datasetId;
  } else if (modalType === "newModal") {
    newID = datasetId;
  }

  // Determine which button triggered the modal
  const buttonId = button.getAttribute("id");

  // Update the text of the corresponding button with the dataset name based on modalType
  if (modalType === "oldModal") {
    document.getElementById("oldButton").innerText =
      "Old Dataset: " + datasetName;
    startFunction("getDataflowIds", oldID);
    checkSchemas(oldID, newID)

  } else if (modalType === "newModal") {
    document.getElementById("newButton").innerText =
      "New Dataset: " + datasetName;
      checkSchemas(oldID, newID)

  }

  // Reset modal or perform other actions if needed
  resetModal();
}

// ------------------------------------------------ Build Alert --------------------------------------------------

async function checkSchemas(oldID, newID) {
    if (oldID !== null && newID !== null) {
      var oldSchema = await getDataSetSchema(oldID);
      var newSchema = await getDataSetSchema(newID);
  
      // Compare schemas
      if (schemasMatch(oldSchema, newSchema)) {
        updateAlert("Dataset Schemas Match", "alert-success");
      } else {
        updateAlert("Dataset Schemas do not Match", "alert-danger");
      }
    } else {
      if (oldID === null && newID === null) {
        updateAlert("Select Datasets", "alert-info");
      } else if (oldID !== null && newID === null) {
        updateAlert("Select New Dataset", "alert-info");
      } else if (oldID === null && newID !== null) {
        updateAlert("Select Old Dataset", "alert-info"); 
      }
    }
  }

function schemasMatch(newSchema, oldSchema) {
  // Iterate over each object in the newList
  for (const newObj of oldSchema) {
    // Find an object in oldList that matches the columnName and type of newObj
    const matchingOldObj = newSchema.find(
      (oldObj) =>
        oldObj.columnName === newObj.columnName && oldObj.type === newObj.type
    );

    // If no matching object is found, return false
    if (!matchingOldObj) {
      return false;
    }
  }

  // All objects in newList have matching objects in oldList, return true
  return true;
}

// ------------------------------------------------ Schema Checker ----------------------------------------------------------------
// Get Dataset Schema
async function getDataSetSchema(dataSetId) {
  const getDataSetQuery = `/domo/datasources/v1/${safelyGetID(
    dataSetId
  )}/schema`;
  const dataSetSchema = await domo.get(getDataSetQuery).catch(function () {
    return null;
  });
  if (dataSetSchema) {
    const dataSetColumnList = dataSetSchema["columnList"];
    const filteredDataSetColumnList = filterColumns(dataSetColumnList);
    return filteredDataSetColumnList;
  }

  return null;
}

// Grabs Column Name and Data type and returns a list
function filterColumns(list) {
  return list.map(({ name, type }) => ({ columnName: name, type }));
}

// Function to update the alert banner

function updateAlert(message, alertClass) {
    const alertElement = document.getElementById("alert");

    // Set alert message and class
    alertElement.innerHTML = message;
    alertElement.className = "alert " + alertClass;

    // Display the alert
    alertElement.style.display = "block";
}



// ------------------------------------------------------ Start Code Engine Function ---------------------------------
async function startFunction(functionAlias, inputParameters) {
  var result = await domo.post(
    `/domo/codeengine/v2/packages/${functionAlias}`,
    { oldDataset: inputParameters }
  );

  var gridDiv = document.querySelector("#myGrid");
  var tableData = result["dataflowIds"];
  gridApi.setGridOption("rowData", tableData);
}

// ------------------------------------------------------ Start Workflow ---------------------------------
const startWorkflow = (alias, body) => {
  domo.post(`/domo/workflow/v1/models/${alias}/start`, body);
};

// ------------------------------------------------ AG Grid Table ----------------------------------------------------------------
// Configure Table
const gridOptions = {
  columnDefs: [
    {
      headerName: "Dataflow Name",
      field: "name",
      headerCheckboxSelection: true,
      checkboxSelection: true,}
    // },
    // {
    //   headerName: "Dataflow ID",
    //   field: "databaseId",
    //   flex: 1.75,
    // },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 100,
  },
  rowSelection: "multiple",
  overlayNoRowsTemplate:
    '<span aria-live="polite" aria-atomic="true" style="padding: 10px; border: 2px solid #666; background: #e0e0e0;">Select the Old Dataset</span>',
};

// Get Selected Rows
function getSelectedRows() {
  var selectedRows = gridApi.getSelectedRows();
  var selectedRowsArray = selectedRows.map((row) => ({
    name: row.name,
    id: row.databaseId,
  }));
  return selectedRowsArray;
}

// ------------------------------------------------- Submit Button ---------------------------------------------------------------------
// Things that happen on submit
async function handleSubmit() {
    var results = await getSelectedRows();
    const dataflowList = results.map((item) => item.id);
    
    // Check if oldID, newID, and dataflowList meet the conditions
    if (oldID !== null && newID !== null && dataflowList.length > 0) {
      workflowStart("swapWorkflow", {
        oldDataset: oldID,
        newDataset: newID,
        dataflowIds: dataflowList,
      });
      flashWorkflowStartedAlert('success');
    } else {
      flashWorkflowStartedAlert('fail');
    }
  }

  function flashWorkflowStartedAlert(message) {
    const alertElement = document.getElementById("workflowStartedAlert");
  
    if (message === "success") {
      alertElement.textContent = "Workflow Started";
      alertElement.style.backgroundColor = "#318554"; 
    } else if (message === "fail") {
      alertElement.textContent = "Missing fields, workflow did not start";
      alertElement.style.backgroundColor = "#dc3545";
    }
  
    // Show the alert
    alertElement.style.display = "block";
  
    // Set a timeout to hide the alert after 3 seconds
    setTimeout(() => {
      alertElement.style.display = "none";
    }, 3000);
  }
  

// Listens for submit click
document.getElementById("submitButton").addEventListener("click", handleSubmit);

// --------------------------------------------------- Trigger Worfklow -----------------------------------------------------------------
// Start Workflow
function workflowStart(alias, body) {
  domo.post(`/domo/workflow/v1/models/${alias}/start`, body);
}

// ------------------------------------------------- Additional Functions ---------------------------------------------------------------

// Safely Get ID
function safelyGetID(str) {
  return String(str)
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9-]*/g, "");
}

// function Make Safe Text
function makeSafeText(text) {
  var element = document.createElement("div");
  element.innerText = text;
  return element.innerHTML;
}

function toNumber(x) {
  return Math.round(x)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// Function to handle the button click event

document.addEventListener("DOMContentLoaded", function () {
  var gridDiv = document.querySelector("#myGrid");
  gridApi = agGrid.createGrid(gridDiv, gridOptions);
  gridApi.showNoRowsOverlay();
});

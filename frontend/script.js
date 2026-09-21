const form = document.querySelector("form");  //selects 1st form tag in html 
const amount= document.querySelector("#amount");  // # used to refer to tag id
const description= document.querySelector("#description");
const category = document.querySelector("#category");
const date =document.querySelector("#date");

const expenseList= document.querySelector("#expense-list");
const submitButton = document.querySelector("#submit-btn");

const categoryFilter =document.querySelector("#category-filter");
const monthFilter = document.querySelector("#month-filter");
const searchInput= document.querySelector("#search-input")

const spendingLabel =document.querySelector("#spending")

const loadingMessage =document.querySelector("#loading");
const errorMessage = document.querySelector("#error-message");

//Initialise expense id and store it when editing
let editingExpenseId =null;

//Submit handler
form.addEventListener("submit", function(event){
    event.preventDefault(); //prevents(default actions) refresh or redirecting of the page when butn clicked

    const expense ={
        amount : amount.value,
        description : description.value,
        category :category.value,
        date : date.value
    };

    //initialise standard submit url and method post(adding epense)=>Dynamic URL/method toggle
    let url = "http://localhost:3000/api/expenses";
    let method ="POST";


    //If editing use PUT method
    if (editingExpenseId!==null){
        url =`http://localhost:3000/api/expenses/${editingExpenseId}`;
        method ="PUT";
    }

    fetch(url,{
        method: method,
        headers : {"Content-type": "application/json"},
        body : JSON.stringify(expense)
    })

    .then(response =>{
        if (!response.ok){
            throw new Error("Failed to save expense");
            
        }

        return response.json();
    })

    .then(data =>{
        console.log(data);
        form.reset();
        editingExpenseId=null;
        submitButton.textContent="Add Expense";
        loadExpenses();
    })
    .catch(error=>{
        console.error(error);
        showError("Could not save expense.");
    });
});

//To load expenses (Both all and filtered expenses)
function loadExpenses() {
    showLoading();
    hideError();

    let url = "http://localhost:3000/api/expenses"
    const params = new URLSearchParams();

    //category filter
    if (categoryFilter.value && categoryFilter.value!=="All"){
        params.append("category", categoryFilter.value);
    }

    //month filter
    if (monthFilter.value){
        params.append("month", monthFilter.value);
    }

    //search
    if(searchInput.value.trim() !==""){
        params.append("search",searchInput.value.trim())
    }

    if(params.toString()){
        url += "?" + params.toString();
           //includes or adds the filter parameters in the url (i.e ?category=Food&date=2026-09)
    }

    fetch(url)   //DEFAULTS to GET as no method is given
    .then(response=>{
        if (!response.ok){
            throw new Error("Failed to load expenses");
        }
        return response.json();
    })

    .then(expenses=>{
        displayExpenses(expenses);
        hideLoading();
    })

    .catch(error=>{
        console.error(error);
        hideLoading();
        showError("Could not load expenses");
    });
}


function displayExpenses(expenses) {
    expenseList.innerHTML ="";

    //Calc total
    const total= expenses.reduce((sum,expense) =>{
        return sum+Number(expense.amount);},0);

    //Dynamic dashboard
    if (categoryFilter.value!=="All" && monthFilter.value){
        spendingLabel.textContent= categoryFilter.value+ " Expenses in the month of " +monthFilter.value
    } else if(categoryFilter.value!=="All"){
        spendingLabel.textContent=categoryFilter.value+ " Expenses"
    } else if(monthFilter.value){
        spendingLabel.textContent= "Expenses in the month  " + monthFilter.value
    } else{
        spendingLabel.textContent = "Total spending"
    }

    //Display total spending on dashboard
    document.querySelector("#total-expenses").textContent =`Rs.${total}`;
    document.querySelector("#expense-count").textContent =expenses.length;

    //when no expenses
    if (expenses.length===0){
        expenseList.innerHTML ="No expenses found.";
        return;
    }

    //creating each expense to display
    expenses.forEach(expense => {
        const item=document.createElement("div");
        item.className="expense-item";  //CSS class name

        item.innerHTML=`
        <h3>Amount:Rs.${Number(expense.amount)}</h3>
        Description : ${expense.description},  
        Category : ${expense.category},  
        date : ${expense.date}
        
        <button class="edit-btn">EDIT</button>
        <button class="delete-btn">DELETE</button>
        `;  //These btn listeners are addedbelow

        //Edit
        const editbtn= item.querySelector(".edit-btn");
        editbtn.addEventListener("click", function() {
            amount.value = expense.amount;
            description.value = expense.description;
            category.value = expense.category;
            date.value = expense.date

            editingExpenseId= expense.id;
            submitButton.textContent = "Update Expense";
            window.scrollTo({top:0, behavior: "smooth"})
        });

        //Delete
        const deletebtn= item.querySelector(".delete-btn");
        deletebtn.addEventListener("click", function() {
            const confirmed = confirm("Are you sure you want to delete this expense")

            if (!confirmed) 
                return;

            fetch(`http://localhost:3000/api/expenses/${expense.id}`, {
                method: "DELETE"
            })

            .then(response=>{
                if (!response.ok) {
                    throw new Error("Failed to delete this expense");
                }
                return response.json();
            })

            .then(data =>{
                console.log(data);
                loadExpenses();
            })

            .catch(error =>{
                console.error(error);
                showError("Could not delete expense");
            });
        });


        expenseList.append(item); //This adds the created expense item into the HTML page
    });

};

//Delete
const deletebtn= document.querySelector(".delete-btn");


//Loading
function showLoading() {loadingMessage.style.display ="block";}
function hideLoading() {loadingMessage.style.display ="none";}

//Error
function showError(message) {
    errorMessage.textContent =message;
    errorMessage.style.display = "block";
}

function hideError() {errorMessage.style.display ="none";}

//Filters
categoryFilter.addEventListener("change", loadExpenses);
monthFilter.addEventListener("change", loadExpenses);

searchInput.addEventListener("input",loadExpenses)

//Initial load
loadExpenses();

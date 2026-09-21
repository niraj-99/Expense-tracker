const express= require("express")
const Database= require("better-sqlite3")

//creates instance of express , obj through wich we configure routes and middleware
const app =express()

//middleware
app.use(express.json())

//serve frontend
app.use(express.static("../frontend"));

//initialise a sqlite database
const db = new Database("expenses.db")

db.prepare(`
    CREATE TABLE IF NOT EXISTS expenses(
       id iNTEGER PRIMARY KEY AUTOINCREMENT,
       amount  REAL NOT NULL,
       description TEXT NOT NULL,
       category TEXT NOT NULL,
       date TEXT NOT NULL
    )
`).run();

//Get all or filtered expenses
app.get("/api/expenses", (req,res)=>{
    try{
        const{category,month, search} = req.query;   //.query as we look for it in the URL

        let query= "SELECT * FROM expenses";  //Baseline for dynamic query
        const conditions=[];      //Initialising conditions for the dynamic query building
        const values={};

        //Categor Filter
        if(category && category!=="All"){
            conditions.push("category=@category");
            values.category= category;
        }

        //month filter
        if(month){
            conditions.push("date LIKE @month");
            values.month=`${month}%`;
        }

        //Search
        if (search){
            conditions.push("description LIKE @search");
            values.search=`%${search}%`
        }

        //If filters exists add WHERE and join the values to build the query
        if(conditions.length>0){
            query += " WHERE " + conditions.join(" AND "); //joins condn with 'and' in between  
        }  //Space before and after WHERE and AND is very imp, if not the query might be invalid

        //further building query to get newestdates first
        query += " ORDER BY DATE DESC, id DESC";

        const expenses= db.prepare(query).all(values);
        res.json(expenses);
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Failed to load expenses"})

    }
});

//POST-add expense
app.post("/api/expenses" , (req,res)=>{
    try{
        const{amount,description,category,date} = req.body;  //.body as we look for it in the req being sent

        //Validate that no field is empty
        if (!amount||!description||!category||!date){
            return res.status(400).json({message: "All fields are required"})
        };

        if (Number.isNaN(Number(amount)) || Number(amount) < 0) {  //checks if amount is a +ve num
            return res.status(400).json({
            message: "Amount must be a valid number"
            });
        }

        const result =db.prepare(`
            INSERT INTO expenses (amount, description,category,date)
            VALUES(@amount, @description,@category,@date)
            `).run({
                amount:Number(amount), description,category,date
            });

            //To get the newly added expense to show up on the page
        const expense =db.prepare(`
            SELECT * FROM expenses WHERE id=?
            `).get(result.lastInsertRowid);

        res.status(201).json({message: "Expense added successfully", expense});
    }catch(error){
        console.error(error);
        res.status(500).json({message:"Failed to add expense"});
    }
});

//PUT Edit/Update an existing record
app.put("/api/expenses/:id", (req,res)=>{
    try{
        const id=Number(req.params.id);  //Take the id from the URL, convert it into a number, and store it in id.
        const {amount,description,category,date} = req.body;

        //Validate that no field is empty
        if (!amount||!description||!category||!date){
            return res.status(400).json({message: "All fields are required"})
        };

        if (Number.isNaN(Number(amount)) || Number(amount) < 0) {
            return res.status(400).json({
            message: "Amount must be a valid number"
            });
        }

        //Check if the expense exists
        const existingExpense= db.prepare('SELECT * FROM expenses WHERE id =?').get(id);

        if(!existingExpense){
            return res.status(404).json({message: "Expense not found"});
        }

        //Update expense
        db.prepare(`
            UPDATE expenses
            SET amount=@amount, description=@description,category=@category,date=@date
            WHERE id=@id
            `).run({
                id,
                amount: Number(amount),
                description,category,date
            });

        const updatedExpense= db.prepare(`
            SELECT * FROM expenses WHERE id=?
            `).get(id);

        res.json({message:"Expense Update successful",
            expense: updatedExpense
        });
    }catch(error){
        console.error(error);
        res.status(500).json({message:"Failed to update expense"});
    }
});

//Delete Expense
app.delete("/api/expenses/:id", (req,res)=>{
    try{
        const id = Number(req.params.id);

        const result = db.prepare(`
            DELETE FROM expenses WHERE id=?
            `).run(id);

        //IF no rows are effected, means no such expense existed
        if (result.changes===0){
            return res.status(404).json({message:"Expense not found"})
        };

        res.json({message:"Expense deleted"})
    }catch(error){
        console.error(error);
        res.status(500).json({message:"Failed to delete expense"})
    }
})


//Starting the server
app.listen(3000,()=>{
    console.log("Server is running on port 3000");
});
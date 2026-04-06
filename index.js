//MAIN INDEX.JS FILE THAT CONNECTS TO THE DATABASE , STARTS THE PORT , SERVES THE BASE URL & REROUTES TO ROOT

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = requiw
const morgan = require("morgan");

const {mongooseUrl , port} = require("./Configrations/config.js");
const {rootRouter} = require("./Routes/rootRoute.js");

const app = express();
app.use(express.json());
// app.use(cookieParser());
// app.use(helmet());
// app.use(cors());


app.use("/" , rootRouter);

async function MAIN(){
    
    try {

        await mongoose.connect(mongooseUrl);
        app.listen(port ,()=>{
            console.log(`THE SERVER IS STARTED ON PORT NO . ${port}`);
        })
        
    } catch (error) {

        console.log(`SOME ERROR OCCURED WHILE CONNECTING TO THE DATABASE\n${error}`);
        process.exit(0);

    }
}

MAIN();
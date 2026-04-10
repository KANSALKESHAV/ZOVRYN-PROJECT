// ROLE BASED ACCESS CONTROLLING
// NO REQUIREMENT FOR ONLY ADMIN ENDPOINTS DUE TO SEPERATE ADMIN ROUTES , DATABASE AND AUTHENTICATION
// NO REQUIREMENT FOR DEFINING VIEWER DUE TO LEAST AMOUNT OF ACCESS 
// ONLY REQUIRE DEFININTION FOR RBAC FOR AUTHORISATION OF ANALYST AND HIGHER ROLES

async function RbacAnalystOrAdminOnly (req , res , next){

    let rbacAccessVar = false;
    let accessedUser = null;

    if(!req.authUser && !req.authAdmin){

        res.status(401).json({
            MESSAGE : "AUTHENTICATION REQUIRED"
        });
        return;

    };

    if(req.authUser && req.authUser.role == "ANALYST"){

        accessedUser = req.authUser;
        rbacAccessVar = true;

    }

    if (!accessedUser && req.authAdmin){

        accessedUser = req.authAdmin;
        rbacAccessVar = true;
    }

    if (rbacAccessVar == false){

        res.status(401).json({
            MESSAGE : "ACCESS DENIED || REQUIRE HIGHER AUTHORISATION"
        });
        return;

    }

    if (rbacAccessVar == true){

        console.log(`ACCESS GRANTED TO ${accessedUser.email}`)
        next();
        return;
        
    }
};

module.exports = {
    RbacAnalystOrAdminOnly
};
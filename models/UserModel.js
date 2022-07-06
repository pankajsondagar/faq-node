import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Users = db.define('users',{
    surname:{
        type: DataTypes.STRING
    },
    lastname:{
        type: DataTypes.STRING
    },
    company:{
        type: DataTypes.STRING
    },
    email:{
        type: DataTypes.STRING
    },
    password:{
        type: DataTypes.STRING
    },
    refresh_token:{
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.NUMBER
    }
},{
    freezeTableName:true
});

export default Users;
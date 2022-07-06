import Users from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';

export const getUsers = async(req, res) => {
    try {
        const users = await Users.findAll({
            attributes:['id','surname', 'lastname', 'company','email']
        });
        res.json(users);
    } catch (error) {
        console.log(error);
    }
}

export const Register = async(req, res) => {
    const { surname, lastname, company , email, password, confPassword } = req.body;
    if(password !== confPassword) return res.status(400).json({msg: "Password and Confirm Password must match"});
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    try {
        await Users.create({
            surname: surname,
            lastname: lastname,
            company: company,
            email: email,
            password: hashPassword
        });

        var transport = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "b1d3e45a82b6de",
                pass: "7f49ca23de0c21"
            }
        });

        var verificationURL = "http://localhost:3000/account-verify?email=" + email;

        var mailOptions = {
            from: '"Example Team" <from@example.com>',
            to: email,
            subject: 'Account Verification',
            text: 'Hello ' + surname + ' ' + lastname + ', Please click on the below link to verify your account ' + verificationURL,
            html: '<b>Hello ' + surname + ' ' + lastname + ', </b> Please click on the below link to verify your account <br></br><a href="'+verificationURL+'">Verify</a>'
        };
          
        transport.sendMail(mailOptions, function(error, info){
            if (error) {
                return res.status(404).json({msg: error.message});
            } else {
                return res.json({msg: "Register Successfull"});
            }
        }); 
    } catch (error) {
        console.log(error);
    }
}

export const Login = async(req, res) => {
    try {
        const user = await Users.findAll({
            where:{
                email: req.body.email
            }
        });
        const match = await bcrypt.compare(req.body.password, user[0].password);
        if(!match) return res.status(400).json({msg: "Invalid Email or Password!"});
        // Check if email is verified or not
        if(user[0].status == 0) {
            return res.status(400).json({msg: "Email is not verified!"});
        }
        const userId = user[0].id;
        const name = user[0].name;
        const email = user[0].email;
        const accessToken = jwt.sign({userId, name, email}, process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: '20s'
        });
        const refreshToken = jwt.sign({userId, name, email}, process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: '1d'
        });
        await Users.update({refresh_token: refreshToken},{
            where:{
                id: userId
            }
        });
        res.cookie('refreshToken', refreshToken,{
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ accessToken });
    } catch (error) {
        res.status(404).json({msg:"Invalid Email or Password!"});
    }
}

export const Logout = async(req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) return res.sendStatus(204);
    const user = await Users.findAll({
        where:{
            refresh_token: refreshToken
        }
    });
    if(!user[0]) return res.sendStatus(204);
    const userId = user[0].id;
    await Users.update({refresh_token: null},{
        where:{
            id: userId
        }
    });
    res.clearCookie('refreshToken');
    return res.sendStatus(200);
}

export const ForgetPassword = async(req, res) => {
    try {
        const user = await Users.findOne({
            where:{
                email: req.body.email
            }
        });
        if(!user) {
            return res.status(400).json({msg: "Email is not registered with us!"});
        } else {

            var transport = nodemailer.createTransport({
                host: "smtp.mailtrap.io",
                port: 2525,
                auth: {
                    user: "b1d3e45a82b6de",
                    pass: "7f49ca23de0c21"
                }
            });
            
            var password         = '';
            var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for ( var i = 0; i < 5; i++ ) {
                password += characters.charAt(Math.floor(Math.random() * charactersLength));
            }

            // Update the password
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash(password, salt);
            await Users.update({password: hashPassword},{
                where:{
                    id: user.id
                }
            });

            var mailOptions = {
                from: '"Example Team" <from@example.com>',
                to: req.body.email,
                subject: 'Forget Password',
                text: 'Hello ' + user.surname + ' ' + user.lastname + ', Your new password is now : ' + password,
                html: '<b>Hello ' + user.surname + ' ' + user.lastname + ', </b><br></br>' + 'Your new password is now : ' + password
            };
              
            transport.sendMail(mailOptions, function(error, info){
                if (error) {
                    return res.status(404).json({msg: error.message});
                } else {
                    return res.json({msg: "Email with new password has been sent to you, check your inbox!"});
                }
            }); 
        }
    } catch (error) {
        res.status(404).json({msg:error.message});
    }
}

export const VerifyAccount = async(req, res) => {
    try {
        const user = await Users.findOne({
            where:{
                email: req.body.email
            }
        });
        if(!user) {
            return res.status(400).json({msg: "Email is not registered with us!"});
        } else {
            await Users.update({status: 1},{
                where:{
                    id: user.id
                }
            });

            return res.json({msg: "Your account is verified now!"});
        }
    } catch (error) {
        res.status(404).json({msg:error.message});
    }
}
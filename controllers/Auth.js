const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenearator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const {passwordUpdated} = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
const { response } = require("express");
require("dotenv").config();

//SIGNUP
exports.signup = async(req, res) => {
    try{
        //data fetch from request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;
        //validate
        if(!firstName || !lastName || !email || !password || !confirmPassword
            || !otp){
                return res.status(403).json({
                    success:false,
                    message:"All fields are required",
                });
            }

        //2 password match karlo
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:'Passwords does not match, please enter again',
            });
        }

        //check user already exist 
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User is already exists. Please sign in to continue.",
            });
        }

        //find most recent OTP for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);

        //validate
        if(response.length === 0) {
            //OTP npt found for the email
            return res.status(400).json({
                success:false,
                message:'OTP not found',
            })
        }else if(otp !== response[0].otp){
            //Invalid OTP
            return res.status(400).json({
                success:false,
                message:"Invalid OTP",
            });
        }
        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //create the user
        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);

        //entry creation in db
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });

        const user = await User.create({
            firstName,lastName,email,contactNumber,
            password:hashedPassword,
            accountType:accountType,
            approved: approved,
            additionalDetails:profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstname} ${lastName}`,
        });

        //return res
        return res.status(200).json({
            success:true,
            message:'User is registered successfully',
            user,
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered. Please try again",
        });
    }
};

//login
exports.login = async(req, res) => {
    try{
        //get data from rq body
        const {email, password} = req.body;

        //validate data
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'All fields are required, please try again',
            });
        }
        //find user with provided email
        const user = await user.findOne({email}).populate("additionalDetails");

        //if user not found with provided email
        if(!user){
            //return 401 unauthorized status code with error message
            return res.status(401).json({
                success:false,
                message:`User is not registered with us, please signup first`,
            });
        }

        //generate JWT, after matching password
        if(await bcrypt.compare(password, user.password)){
            const token = jwt.sign( 
                { email: user.email, id: user._id, role: user.role },
                process.env.JWT_SECRET,
                {
                    expiresIn:"2h",
                }
            );

            //save token to user document in database
            user.token = token;
            user.password = undefined;

            //set cookie for token and return success response   
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            };     
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message:`Logged in successfully`,
            });
        }
        else{
            return res.status(401).json({
                 success:false,
                 message:`Password is incorrect`,
            });
        }   
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:`Login Failure, please try again`,
        });
    }
};

//sendOTP
exports.sendOTP = async(req, res) => {

    try{
        //fetch email from request body
        const {email} = req.body; 
        console.log("error");
        //check if user already exist
        const checkUserPresent = await User.findOne({email});
       
        //if exist them return a response
        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:`User already registered`,
            });
        }

        //generate otp
        var otp = otpGenearator.generate(6, {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });

        //check unique otp or not
        const result = await OTP.findOne({otp: otp});
        console.log("Result is generate otp funcn");
        console.log("OTP", otp);
        console.log("Result", result);
        while(result){
            otp = otpGenearator(6, {
                upperCaseAlphabets:false,
            });
        }

        const otpPayload = {email, otp};
        
        //create an entry in db for otp
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP Body", otpBody);

        //return response successful
        res.status(200).json({
            success:true,
            message:`OTP Sent Successfully`,
            otp,
        });
    }
    catch(error){
        console.log(error.message);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
     
};

//changePassword HW
exports.changePassword = async (req, res) => {
    try{
        //get data from req body
        const userDetails = await User.findById(req.user.id);

        //get oldpass, newpass, confirm newpass
        const {oldPassword, newPassword, confirmNewPassword} = req.body;

        //validation
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );
        if(!isPasswordMatch){
            //if old password does not match return a 401 (unauthorized) error
            return res
                .status(401)
                .json({success: false, message:"The password is inncorrect"});
        }

        //match new password and confirm new password
        if(newPassword !== confirmNewPassword){
            //if new password and confirm new password don't match return 400 (bad request) error
            return res.status(400).json({
                success: false,
                message: "The passwords do not match",
            });
        }

        //update pwd in DB
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updateUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            {password: encryptedPassword},
            {new: true}
        );

        //send mail regarding password update
        try{
            const emailResponse = await mailSender(
                updateUserDetails.email,
                passwordUpdated(
                    updateUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            console.log("Email sent successfully:",emailResponse.response);
        }catch (error){
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
        }

        //return password
        return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	} catch (error) {
		// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
    }
    
};


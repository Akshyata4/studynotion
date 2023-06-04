const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");


//createCourse handler funcn
exports.createCourse = async(req, res) => {
    try{
        // Get user ID from request object
		const userId = req.user.id;

        //Get all required fields from request body
        let {
            courseName, 
            courseDescription, 
            whatYouWillLearn, 
            price, 
            tag,
            category,
            status,
            instructions,
        } = req.body;

        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if(
            !courseName || 
            !courseDescription || 
            !whatYouWillLearn || 
            !price || 
            !tag || 
            !thumbnail ||
            !category
        ){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            });
        }
        if(!status || status === undefined){
            status = "Draft";
        }

        //check for instructor
        const instructorDetails = await User.findById(userId, {
            accountType: "Instructor",
        });

        //TODO: verify that userId and instructorDetails._id are same or different?

        if(!instructorDetails){
            return res.status(404).json({
                success:false,
                message:'Instructor Details not found',
            });
        }

        //given tag is valid or not
        const tagDetails = await Category.findById(category);
        if(!tagDetails){
            return res.status(404).json({
                success:false,
                message:'Tag Details not found',
            });
        }

        //Upload thumbnail to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(
            thumbnail, 
            process.env.FOLDER_NAME
        );
        console.log(thumbnailImage);

        //create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag: tag,
            category: categoryPageDetails._id,
            thumbnail: thumbnailImage.secure_url,
            status: status,
            instructions: instructions,
        });

        //add the new course to the user schema of instructor
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            {new:true}
        );

        //add the new course to the categories
        await Category.findByIdAndUpdate(
            {_id: category},
            {
                $push: {
                    courses: newCourse._id,
                },
            },
            {new: true}
        );

        //return response
        return res.status(200).json({
            success:true,
            data: newCourse,
            message:"Course created successfully",
        });
    } 
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to create course',
            error: error.message,
        })
    }
};

//getAllCourses handler funcn

exports.getAllCourses = async (req, res) => {
    try{
        const allCourses = await Course.find({}, {  courseName:true,
                                                    price:true,
                                                    thumbnail:true,
                                                    instructor:true,
                                                    ratingAndReviews:true,
                                                    studentsEnrolled:true,
                                                }
                                            )
                                                    .populate("instructor")
                                                    .exec();
        return res.status(200).json({
            success:true,
            message:'Data for all courses fetched successfully',
            data:allCourses,
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:`Cannot fetch course data`,
            error: error.message,
        })
    }
};

//getCourseDetails
exports.getCourseDetails = async (req, res) => {
    try{
        //get id
        const {courseId} = req.body;
        //find course details
        const courseDetails = await Course.find(
                                    {_id:courseId})
                                    .populate(
                                        {
                                            path:"instructor",
                                            populate:{
                                                path:"additionalDetails",
                                            },
                                        }
                                    )
                                    .populate("category")
                                    .populate("ratingAndReviews")
                                    .populate({
                                        path:"courseContent",
                                        populate:{
                                            path:"subSection",
                                        },
                                    })
                                    .exec();

        //validation
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find the course with ${courseId}`,
            });
        }      
        //return response
        return res.status(200).json({
            success:true,
            message:"Course details fetched successfully",
            data:courseDetails,
        })                      
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}
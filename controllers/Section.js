const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async(req, res) => {
    try{
        //data fetch
        const {sectionName, courseId} = req.body;
        //data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:'Missing Propeties',
            });
        }
        //create section
        const newSection = await Section.create({sectionName});
        //update course with section objectId
        const updatedCourse = await Course.findByIdAndUpdate(
                                            courseId,
                                            {
                                                $push:{
                                                    courseContent:newSection._id,
                                                }
                                            },
                                            {new:true}
        )
                                            .populate({
                                                path: "courseContent",
                                                populate: {
                                                    path: "subSection",
                                                },
                                            })
                                            .exec();
        //HW use populate to replace sections/sub-sections both in updated course---------------------------------------
        //return response
        return res.status(200).json({
            success:true,
            message:'Section created successfully',
            updatedCourse,
        });
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:"Unable to create section, please try again",
            error:error.message,
        });
    }
};

exports.updateSection = async(req, res) => {
    try{
        //data input
        const {sectionName, sectionId} = req.body;
        const section = await Section.findByIdAndUpdate(
            sectionId,
            {sectionName},
            {new: true}
        );

        //return res
        res.status(200).json({
            success:true,
            message: section,
        });
    }catch(error){
        console.log("Error updating section:", error);
        res.status(500).json({
            success:false,
            message:"Internal sever error",
        });
    }
};

//delete a section
exports.deleteSection = async (req,res) => {
    try{
        //get ID - assuming that we are sending ID in params
        const {sectionId} = req.params
        //use findByIdAndDelete
        await Section.findByIdAndDelete(sectionId);
        //TODO: do we need to delete the entry from the course schema??
        //return response
        res.status(200).json({
            success:true,
            message:"Section Deleted Successfully",
        });
    }catch(error){
        console.error("Error deleting section:", error);
        res.status(500).json({
            success:false,
            message:"Internal server error",
        });
    }
};
//import the required modules
const express = require("express")
const router = express.Router()

//import the controllers

//course controllers import
const{
    createCourse,
    getAllCourses,
    getCourseDetails,
} = require("../controllers/Course")


//categories controllers import
const{
    showAllCategories,
    createCategory,
    categoryPageDetails,
} = require("../controllers/Category");

//sections controllers import
const{
    createSection,
    updateSection,
    deleteSection,
} = require("../controllers/Section");

// Sub-Sections Controllers Import
const {
    createSubSection,
    updateSubSection,
    deleteSubSection,
} = require("../controllers/Subsection");

// Rating Controllers Import
const {
    createRating,
    getAverageRating,
    getAllRating,
} = require("../controllers/RatingAndReview");

//importing middlewares
const{auth, isInstructor, isStudent, isAdmin} = require("../middlewares/auth")

//COURSE ROUTES

//courses can only be created by instructors
router.post("/createCourse", auth, isInstructor, createCourse)

//Add a section to a course
router.post("/addSection", auth, isInstructor, createSection)

//update a section
router.post("/updateSection", auth, isInstructor, updateSection)

//delete a section
router.post("/deleteSection", auth, isInstructor, deleteSection)

//edit sub section
router.post("/updateSubSection", auth, isInstructor, updateSubSection)

//delete sub section
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection)

//add a subsection to a section
router.post("/addSubSection", auth, isInstructor, createSubSection)

// Get all Registered Courses
router.get("/getAllCourses", getAllCourses)

// Get Details for a Specific Courses
router.post("/getCourseDetails", getCourseDetails)

//CATEGORY ROUTES (only by admin)
//category can only be created by admin
router.post("/createCategory", auth, isAdmin, createCategory) 
router.get("/showAllCategories", showAllCategories)
router.post("/getCategoryPageDetails", categoryPageDetails)

//RATING AND REVIEW
router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)

router.get("/getReviews", getAllRating)

module.exports = router

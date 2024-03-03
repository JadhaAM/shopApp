const express = require("express");
const { registerUser, authUser, allUsers } = require("../controllers");
const { protect } = require("../middleware");
var bodyParser = require('body-parser')
const textflow = require("textflow.js")

textflow.useKey("ElNSNRLo1ROmsQA0YwIlznYVMW1ksRaTh2cFXwQ64lQBpDdeZQyNIbkSCdnduqTw")

const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

class User {
    static list = {}
    constructor(email, phoneNumber, password) {
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.password = password;
    }
    static add(email, password, phoneNumber) {
        if (!email || this.list[email])
            return false;

        this.list[email] = new User(email, phoneNumber, password);
        return true;
    }
}



router.route("/").post(registerUser).get(protect, allUsers); // Both request supported on the same route
router.post("/LoginScreen", authUser);
router.post("/register", async (req, res) => {
    const { email, phoneNumber, password, code } = req.body

    var result = await textflow.verifyCode(phoneNumber, code);

    if(!result.valid){
        return res.status(400).json({ success: false });
    }

    if (User.add(email, phoneNumber, password))
        return res.status(200).json({ success: true });

    return res.status(400).json({ success: false });
})
router.post("/verify", async (req, res) => {
    const { phoneNumber } = req.body

    var result = await textflow.sendVerificationSMS(phoneNumber);

    if (result.ok) //send sms here
        return res.status(200).json({ success: true });

    return res.status(400).json({ success: false });
})

module.exports = router;

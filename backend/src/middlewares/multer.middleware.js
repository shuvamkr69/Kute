import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

export const upload = multer({
    storage,
}).fields([
    { name: "avatar1", maxCount: 1 },
    { name: "avatar2", maxCount: 1 },
    { name: "avatar3", maxCount: 1 },
    { name: "avatar4", maxCount: 1 },
    { name: "avatar5", maxCount: 1 },
    { name: "avatar6", maxCount: 1 },
]);

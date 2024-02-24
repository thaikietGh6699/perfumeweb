const express = require("express");
const app = express();
const port = 4000;
const cors = require("cors");
const db = require("./connect");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret = "fasewa3123asff123";
const { Account } = require("./module/Account");
const cookieParser = require("cookie-parser");
const imgDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");
const Product = require("./module/Product");
const Oder = require("./module/Order");
const Cart = require("./module/Cart");
const Feedback = require("./module/Feedback");

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(__dirname + "/uploads"));

//* Connect Mongodb
db.connect();

//* Giao tiếp api và client
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

//*Kiểm tra lỗi máy chủ
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.get("/", (req, res) => {
  res.json("hello word");
});

//*Kiểm tra email đã tồn tại
app.get("/check-email/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await Account.findOne({ email });
    if (user) {
      return res.json({ exists: true });
    }
    return res.json({ exists: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Có lỗi xảy ra khi kiểm tra email" });
  }
});

//*Đăng Ký
app.post("/register", async (req, res) => {
  const { name, email, password, address, phone } = req.body;
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const UserDoc = await Account.create({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
    });
    res.json(UserDoc);
  } catch (e) {
    res.send("fail");
  }
});

//* Đăng nhập
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userDoc = await Account.findOne({ email });

    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        const token = jwt.sign(
          {
            email: userDoc.email,
            id: userDoc._id,
            name: userDoc.name,
            phone: userDoc.phone,
            address: userDoc.address,
            password: userDoc.password,
          },
          jwtSecret,
          { expiresIn: "1h" }
        );
        res
          .cookie("token", token, { httpOnly: true, secure: true })
          .json(userDoc);
      } else {
        res.status(422).json({ error: "Mật khẩu không đúng! Hãy thử lại." });
      }
    } else {
      res.status(404).json({ error: "Người dùng không tồn tại." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Đã xảy ra lỗi không mong muốn." });
  }
});

//* Cập nhật thông tin
app.put("/update-account", async (req, res) => {
  const { token } = req.cookies;
  const { name, address, phone } = req.body;

  try {
    const userData = await jwt.verify(token, jwtSecret);
    const updatedUser = await Account.findByIdAndUpdate(
      userData.id,
      { name, address, phone },
      { new: true }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin tài khoản:", error);
    res
      .status(500)
      .json({ message: "Có lỗi xảy ra khi cập nhật thông tin tài khoản" });
  }
});

//*Đổi mật khẩu
app.put("/update-password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    const user = await Account.findById(userId);

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res
        .status(400)
        .json({ message: "Mật khẩu hiện tại không chính xác." });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: "Mật khẩu đã được cập nhật thành công." });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật mật khẩu." });
  }
});

//*Profile
app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  }
  res.json(null);
});

//*Đăng xuất
app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

//*Upload photo by link
app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  await imgDownloader.image({
    url: link,
    dest: __dirname + "/uploads/" + newName,
  });
  res.json(newName);
});

//*Upload photo by device
const photoMiddleware = multer({ dest: "uploads/" });
app.post("/upload", photoMiddleware.array("photos", 100), (req, res) => {
  const uploadFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);
    uploadFiles.push(newPath.replace("uploads\\", ""));
  }
  res.json(uploadFiles);
});

//*Đăng sản phẩm
app.post("/product", (req, res) => {
  const { token } = req.cookies;
  const {
    name,
    addPhotos,
    price,
    description,
    gender,
    born,
    from,
    type,
    title,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const ProductDoc = await Product.create({
      owner: userData.id,
      name,
      price,
      photo: addPhotos,
      description,
      gender,
      born,
      from,
      type,
      title,
    });
    res.json(ProductDoc);
  });
});

//*Lấy thông tin sản phẩm
app.get("/user-product", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Product.find({ owner: id }));
  });
});

//*Lấy thông tin người dùng
app.get("/user-info", async (req, res) => {
  try {
    const { token } = req.cookies;
    if (token) {
      const userData = await jwt.verify(token, jwtSecret);
      const { id } = userData;
      const user = await Account.findById(id);
      const isAdmin = user.isAdmin;
      res.json({ isAdmin });
    } else {
      res.status(401).json({ isAdmin: false });
    }
  } catch (err) {
    res.status(500).json({ isAdmin: false });
  }
});

app.get("/product/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Product.findById(id));
});

//*Cập nhật sản phẩm
app.put("/product", async (req, res) => {
  const { token } = req.cookies;
  const {
    name,
    addPhotos,
    description,
    gender,
    price,
    id,
    born,
    from,
    type,
    title,
  } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const productDoc = await Product.findById(id);
    if (userData.id === productDoc.owner.toString()) {
      productDoc.set({
        owner: userData.id,
        name,
        photo: addPhotos,
        description,
        gender,
        price,
        born,
        from,
        type,
        title,
      });
      await productDoc.save();
      res.json("ok");
    }
  });
});

app.get("/product", async (req, res) => {
  res.json(await Product.find());
});

//* Đặt hàng
function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}
app.post("/oder", async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const { product, price, quantity, name, note, orderDate, address, phone } =
    req.body;
  Oder.create({
    quantity,
    product,
    price,
    name,
    note,
    address,
    phone,
    orderDate,
    user: userData.id,
    email: userData.email,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      throw err;
    });
});

//* Hủy đơn
app.delete("/oder/:id", async (req, res) => {
  try {
    const deletedOrder = await Oder.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    res.json({ message: "Đơn hàng đã được hủy" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

//* Lấy dữ liệu từ oder
app.get("/oder", async (req, res) => {
  const userData = await getUserDataFromReq(req);
  res.json(await Oder.find({ user: userData.id }).populate("product"));
});

//* Nhận đơn hàng
app.get("/api/orders-for-admin", async (req, res) => {
  const odersForAdmin = await Oder.find().populate("product");
  return res.json(odersForAdmin);
});

//* đã bán
app.patch("/update-order/:oder_id", async (req, res) => {
  const { oder_id } = req.params;
  const { sold } = req.body;

  try {
    const oder = await Oder.findById(oder_id);

    if (!oder) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }
    oder.sold = sold;
    await oder.save();

    return res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

//* đã nhận hàng
app.patch("/update-order-daban/:oder_id", async (req, res) => {
  const { oder_id } = req.params;
  const { received } = req.body;

  try {
    const oder = await Oder.findById(oder_id);

    if (!oder) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }
    oder.received = received;

    await oder.save();

    return res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

//* thêm vào giỏ hàng
app.post("/add-to-cart", async (req, res) => {
  const { productID } = req.body;
  const userData = await getUserDataFromReq(req);
  const productDetails = await Product.findById(productID);

  if (!productDetails) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  Cart.create({
    user: userData.id,
    product: productID,
  })
    .then((doc) => {
      res.json({
        success: true,
        cartItem: { ...doc.toObject(), product: productDetails },
      });
    })
    .catch((err) => {
      throw err;
    });
});

//* Top sp bán chạy
app.get("/top-sales-products", async (req, res) => {
  try {
    const topSalesProducts = await Product.find().sort({ sales: -1 }).limit(5);
    res.json(topSalesProducts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy sản phẩm", error });
  }
});

//* lấy dữ liệu giỏ hàng
app.get("/get-cart-items", async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const cartItems = await Cart.find({ user: userData.id }).populate(
      "product"
    );
    res.json(cartItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

//* Xóa sp trong giỏ hàng
app.delete("/remove-from-cart", async (req, res) => {
  const { productId } = req.body;

  try {
    console.log("Deleting product with ID:", productId);

    res.json({ message: "Product removed from the cart successfully." });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).json({
      message: "An error occurred while removing the product from the cart.",
    });
  }
});

//* tìm kiếm sản phẩm
app.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.query.toLowerCase();
    const searchResults = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { title: { $regex: searchTerm, $options: "i" } },
        { type: { $regex: searchTerm, $options: "i" } },
        { gender: { $regex: searchTerm, $options: "i" } },
        { from: { $regex: searchTerm, $options: "i" } },
        { born: searchTerm },
      ],
    });

    res.json(searchResults);
  } catch (error) {
    console.error("Error handling search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//* xóa sản phẩm trong giỏ hàng
app.delete("/remove-from-cart/:productId", async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const { productId } = req.params;

    const deletedCartItem = await Cart.findOneAndDelete({
      user: userData.id,
      product: productId,
    });

    if (!deletedCartItem) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không tồn tại trong giỏ hàng" });
    }

    res.json({ message: "Xóa sản phẩm từ giỏ hàng thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server khi xóa sản phẩm từ giỏ hàng" });
  }
});

//* Cập nhật lại đơn hàng
app.post("/update-revenued/:itemId", async (req, res) => {
  const { itemId } = req.params;
  try {
    const item = await Cart.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy item" });
    }
    item.revenued = true;
    await item.save();

    res.status(200).json({ message: "Cập nhật revenued thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

//* Đánh giá
app.post("/product/:productId/reviews", async (req, res) => {
  try {
    const { productId } = req.params;
    const { review, userId, email, name, orderDate } = req.body;
    const product = await Product.findById(productId);
    product.reviews.push({ review, user: userId, name, email, orderDate });
    await product.save();

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ success: false, error: "Failed to add review" });
  }
});

//* Số lượng bán
app.patch("/product/:id", async (req, res) => {
  const productId = req.params.id;
  const { sales } = req.body;

  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { sales: sales },
      { new: true }
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không được tìm thấy" });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Lỗi khi cập nhật sales của sản phẩm:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật sales của sản phẩm",
    });
  }
});

//* phản hồi sp lỗi
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/feedback", upload.array("image"), async (req, res) => {
  const { name, email, note, phone } = req.body;
  let images = [];

  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => file.filename);
  }

  const userData = await getUserDataFromReq(req);

  try {
    const newFeedback = new Feedback({
      name,
      email,
      note,
      images,
      phone,
      user: userData.id,
    });

    await newFeedback.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi lưu phản hồi:", error);
    res.status(500).json({ success: false, error: "Lỗi khi lưu phản hồi" });
  }
});

app.get("/feedback", async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const feedbackData = await Feedback.find({ user: userData.id });
    res.json(feedbackData);
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/feedback-all", async (req, res) => {
  try {
    const allFeedback = await Feedback.find();
    res.json(allFeedback);
  } catch (error) {
    console.error("Error fetching all feedback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//* xóa phản hồi
app.delete("/feedback/:id", async (req, res) => {
  const feedbackId = req.params.id;

  try {
    const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!deletedFeedback) {
      return res.status(404).send("Không tìm thấy phản hồi để xóa.");
    }

    res.send(`Phản hồi có ID ${feedbackId} đã được xóa thành công.`);
  } catch (error) {
    console.error("Lỗi khi xóa phản hồi:", error);
    res.status(500).send("Lỗi khi xóa phản hồi.");
  }
});

//* Khởi động máy chủ
app.listen(port, () => {
  console.log(`App listening at port http://localhost:${port}`);
});

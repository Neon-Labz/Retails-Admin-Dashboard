import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      lowStockProducts,
      outOfStockProducts,
      salesAgg,
      recentOrders,
      recentCustomers,
      stockAgg,
    ] = await Promise.all([
      Product.countDocuments(),
      Customer.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.countDocuments({ status: "processing" }),
      Order.countDocuments({ status: "shipped" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Product.countDocuments({ $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] } }),
      Product.countDocuments({ stock: { $lte: 0 } }),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, totalSales: { $sum: "$total" } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(6),
      Customer.find().sort({ createdAt: -1 }).limit(6),
      Product.aggregate([{ $group: { _id: null, totalStock: { $sum: "$stock" } } }]),
    ]);

    const salesByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const ordersByStatus = [
      { status: "pending", count: pendingOrders },
      { status: "confirmed", count: confirmedOrders },
      { status: "processing", count: processingOrders },
      { status: "shipped", count: shippedOrders },
      { status: "delivered", count: deliveredOrders },
      { status: "cancelled", count: cancelledOrders },
    ];

    const topCategories = await Product.aggregate([
      { $group: { _id: "$category", productCount: { $sum: 1 }, totalStock: { $sum: "$stock" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $sort: { productCount: -1 } },
      { $limit: 5 },
      { $project: { name: "$category.name", productCount: 1, totalStock: 1 } },
    ]);

    return apiSuccess({
      totals: {
        totalProducts,
        totalCustomers,
        totalOrders,
        totalSales: salesAgg[0]?.totalSales || 0,
        availableStock: stockAgg[0]?.totalStock || 0,
        lowStockProducts,
        outOfStockProducts,
        pendingOrders,
        completedOrders: deliveredOrders,
        cancelledOrders,
      },
      ordersByStatus,
      salesByDay,
      recentOrders,
      recentCustomers,
      topCategories,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

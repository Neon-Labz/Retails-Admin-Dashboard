import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const salesOnly = searchParams.get("salesOnly") === "true";

    let salesStart: Date;
    let salesEnd: Date = new Date();

    if (startDateParam && endDateParam) {
      salesStart = new Date(startDateParam);
      salesStart.setHours(0, 0, 0, 0);
      salesEnd = new Date(endDateParam);
      salesEnd.setHours(23, 59, 59, 999);
    } else {
      const days = Math.max(1, Number(daysParam) || 14);
      salesStart = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
      salesStart.setHours(0, 0, 0, 0);
      salesEnd.setHours(23, 59, 59, 999);
    }

    const salesByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: salesStart, $lte: salesEnd }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    if (salesOnly) {
      return apiSuccess({ salesByDay });
    }

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
      urgentStockProducts,
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
      Product.find({
        $or: [
          { stock: { $lte: 0 } },
          { $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] } },
        ],
      })
        .select("_id name sku stock lowStockThreshold images price")
        .sort({ stock: 1 })
        .limit(4),
    ]);

    const inStockProducts = Math.max(0, totalProducts - (lowStockProducts + outOfStockProducts));
    const stockBreakdown = {
      total: totalProducts,
      inStock: inStockProducts,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      inStockPercent: totalProducts > 0 ? Math.round((inStockProducts / totalProducts) * 100) : 0,
      lowStockPercent: totalProducts > 0 ? Math.round((lowStockProducts / totalProducts) * 100) : 0,
      outOfStockPercent: totalProducts > 0 ? Math.round((outOfStockProducts / totalProducts) * 100) : 0,
      urgentItems: urgentStockProducts,
    };

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
      stockBreakdown,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

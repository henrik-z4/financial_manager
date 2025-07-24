import { Router, Request, Response } from "express";
import { AnalyticsService } from "../services/AnalyticsService";
import { db } from "../utils/database";
import { ApiResponse } from "../types";

const router = Router();
const analyticsService = new AnalyticsService(db);

// получить аналитику за период
router.get("/expenses", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const expenseData = await analyticsService.getExpensesByCategory(
      startDate as string,
      endDate as string
    );

    const response: ApiResponse<typeof expenseData> = {
      success: true,
      data: expenseData,
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting expense analytics:", error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: "ANALYTICS_ERROR",
        message: "Ошибка при получении аналитики расходов",
        details: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
    };
    res.status(500).json(response);
  }
});

// получаем тренды расходов
router.get("/trends", async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 12;

    if (months < 1 || months > 60) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: "INVALID_PARAMETER",
          message: "Количество месяцев должно быть от 1 до 60",
        },
      };
      return res.status(400).json(response);
    }

    const trendData = await analyticsService.getSpendingTrends(months);

    const response: ApiResponse<typeof trendData> = {
      success: true,
      data: trendData,
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting spending trends:", error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: "ANALYTICS_ERROR",
        message: "Ошибка при получении трендов расходов",
        details: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
    };
    res.status(500).json(response);
  }
});

// сравнимаем доходы и расходы
router.get("/comparison", async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;

    if (months < 1 || months > 24) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: "INVALID_PARAMETER",
          message: "Количество месяцев должно быть от 1 до 24",
        },
      };
      return res.status(400).json(response);
    }

    const comparisonData = await analyticsService.getIncomeVsExpenseComparison(
      months
    );

    const response: ApiResponse<typeof comparisonData> = {
      success: true,
      data: comparisonData,
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting income vs expense comparison:", error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: "ANALYTICS_ERROR",
        message: "Ошибка при сравнении доходов и расходов",
        details: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
    };
    res.status(500).json(response);
  }
});

// получаем приоритеты расходов
router.get("/priority", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const priorityData = await analyticsService.getExpensesByPriority(
      startDate as string,
      endDate as string
    );

    const response: ApiResponse<typeof priorityData> = {
      success: true,
      data: priorityData,
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting priority analytics:", error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: "ANALYTICS_ERROR",
        message: "Ошибка при получении аналитики по приоритетам",
        details: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
    };
    res.status(500).json(response);
  }
});

// получаем месячную сводку
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const summaryData = await analyticsService.getCurrentMonthSummary();

    const response: ApiResponse<typeof summaryData> = {
      success: true,
      data: summaryData,
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting monthly summary:", error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: "ANALYTICS_ERROR",
        message: "Ошибка при получении месячной сводки",
        details: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
    };
    res.status(500).json(response);
  }
});

// Получаем тренды по категориям
router.get(
  "/category-trends/:category",
  async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const months = parseInt(req.query.months as string) || 6;

      if (!category) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: "MISSING_PARAMETER",
            message: "Категория обязательна для получения трендов",
          },
        };
        return res.status(400).json(response);
      }

      if (months < 1 || months > 24) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: "INVALID_PARAMETER",
            message: "Количество месяцев должно быть от 1 до 24",
          },
        };
        return res.status(400).json(response);
      }

      const categoryTrends = await analyticsService.getCategoryTrends(
        category,
        months
      );

      const response: ApiResponse<typeof categoryTrends> = {
        success: true,
        data: categoryTrends,
      };

      res.json(response);
    } catch (error) {
      console.error("Error getting category trends:", error);
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: "ANALYTICS_ERROR",
          message: "Ошибка при получении трендов категории",
          details:
            error instanceof Error ? error.message : "Неизвестная ошибка",
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;

/**
 * AI Budget Advisor Service
 * Rule-based + pattern detection engine for personalized financial recommendations
 */

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Travel', 'Other'];

const CATEGORY_BENCHMARKS = {
    'Food': 0.30,
    'Transport': 0.15,
    'Entertainment': 0.10,
    'Shopping': 0.10,
    'Bills': 0.20,
    'Health': 0.05,
    'Education': 0.05,
    'Travel': 0.03,
    'Other': 0.02
};

function calculateHealthScore(totalIncome, totalExpenses, budgetAdherence, diversityScore) {
    if (totalIncome === 0) return 50;

    const savingsRate = (totalIncome - totalExpenses) / totalIncome;
    let score = 0;

    // Savings component (0-40 points)
    if (savingsRate >= 0.30) score += 40;
    else if (savingsRate >= 0.20) score += 35;
    else if (savingsRate >= 0.10) score += 25;
    else if (savingsRate >= 0) score += 15;
    else score += Math.max(0, 15 + savingsRate * 50);

    // Budget adherence (0-30 points)
    score += Math.min(30, budgetAdherence * 30);

    // Spending diversity (0-15 points)
    score += Math.min(15, diversityScore * 15);

    // Income stability (0-15 points)
    score += totalIncome > 0 ? 15 : 0;

    return Math.round(Math.min(100, Math.max(0, score)));
}

function generateRecommendations(expenses, income, budgets, monthlyData) {
    const recommendations = [];
    const totalIncome = income.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Category spending analysis
    const categorySpending = {};
    expenses.forEach(e => {
        categorySpending[e.category] = (categorySpending[e.category] || 0) + e.amount;
    });

    // 1. Overspending alert
    if (totalExpenses > totalIncome && totalIncome > 0) {
        const overBy = ((totalExpenses - totalIncome) / totalIncome * 100).toFixed(0);
        recommendations.push({
            type: 'warning',
            title: 'Spending Exceeds Income',
            message: `You're spending ${overBy}% more than you earn this period. Consider cutting back on non-essential categories.`,
            priority: 'high'
        });
    }

    // 2. Savings congratulations
    if (totalIncome > 0 && totalExpenses < totalIncome * 0.7) {
        recommendations.push({
            type: 'success',
            title: 'Excellent Savings Rate',
            message: `You're saving ${((1 - totalExpenses / totalIncome) * 100).toFixed(0)}% of your income. Keep up the great work!`,
            priority: 'low'
        });
    }

    // 3. Category-specific advice
    Object.entries(categorySpending).forEach(([cat, amount]) => {
        const benchmark = CATEGORY_BENCHMARKS[cat] || 0.05;
        const ratio = totalIncome > 0 ? amount / totalIncome : 0;

        if (ratio > benchmark * 1.5) {
            recommendations.push({
                type: 'warning',
                title: `High ${cat} Spending`,
                message: `${cat} costs are ${(ratio * 100).toFixed(0)}% of income (recommended: ${(benchmark * 100).toFixed(0)}%). Try to reduce by ${'\u20B9'}${(amount - totalIncome * benchmark).toFixed(0)}.`,
                priority: 'medium'
            });
        }
    });

    // 4. Budget compliance
    budgets.forEach(budget => {
        const spent = categorySpending[budget.category] || 0;
        if (spent > budget.amount) {
            const over = ((spent - budget.amount) / budget.amount * 100).toFixed(0);
            recommendations.push({
                type: 'danger',
                title: `${budget.category} Over Budget`,
                message: `You've exceeded your ${budget.category} budget by ${over}% (${'\u20B9'}${(spent - budget.amount).toFixed(0)} over).`,
                priority: 'high'
            });
        } else if (spent > budget.amount * 0.8) {
            recommendations.push({
                type: 'info',
                title: `${budget.category} Budget Alert`,
                message: `You've used ${((spent / budget.amount) * 100).toFixed(0)}% of your ${budget.category} budget. Be careful with remaining spending.`,
                priority: 'medium'
            });
        }
    });

    // 5. Spending pattern insights
    if (Object.keys(categorySpending).length === 1) {
        recommendations.push({
            type: 'info',
            title: 'Track More Categories',
            message: 'You\'re only tracking one spending category. Add more categories for better financial insights.',
            priority: 'low'
        });
    }

    // 6. No budget set
    if (budgets.length === 0 && expenses.length > 0) {
        recommendations.push({
            type: 'info',
            title: 'Set Up Budgets',
            message: 'Setting category budgets helps control spending. Go to the Budget Planner to set your first budget.',
            priority: 'medium'
        });
    }

    // 7. Smart savings suggestion
    if (totalIncome > 0 && totalIncome > totalExpenses) {
        const canSave = totalIncome - totalExpenses;
        recommendations.push({
            type: 'success',
            title: 'Savings Opportunity',
            message: `You have ${'\u20B9'}${canSave.toFixed(0)} available to save or invest this period. Consider the 50/30/20 rule for allocation.`,
            priority: 'low'
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
}

function getSpendingDiversity(categorySpending) {
    const values = Object.values(categorySpending);
    if (values.length <= 1) return 0.3;
    const total = values.reduce((s, v) => s + v, 0);
    if (total === 0) return 0.5;

    const entropy = values.reduce((e, v) => {
        const p = v / total;
        return p > 0 ? e - p * Math.log2(p) : e;
    }, 0);
    const maxEntropy = Math.log2(values.length);
    return maxEntropy > 0 ? entropy / maxEntropy : 0.5;
}

module.exports = {
    CATEGORIES,
    calculateHealthScore,
    generateRecommendations,
    getSpendingDiversity,
    CATEGORY_BENCHMARKS
};

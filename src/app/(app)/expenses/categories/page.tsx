import { ExpenseCategoryForm } from "@/components/expenses/expense-category-form";
import { TranslatedText } from "@/components/language/translated-text";

export default function NewExpenseCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          <TranslatedText namespace="expenses" id="categories.new" />
        </h1>
        <p className="text-muted-foreground">
          <TranslatedText namespace="expenses" id="categories.newDescription" />
        </p>
      </div>

      <ExpenseCategoryForm />
    </div>
  );
}

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { CampaignBudget, SinaProItem, getInitialBudgets, SINAPRO_CATALOG } from "./sinaproData";

const BUDGETS_COLLECTION = "sinapro_campaign_budgets";
const CATALOG_COLLECTION = "sinapro_catalog_items";

/**
 * Fetches all campaign budgets from Firestore.
 * If the collection is empty, seeds it with initial demo data.
 */
export async function getBudgetsFromFirestore(): Promise<CampaignBudget[]> {
  try {
    const q = query(
      collection(db, BUDGETS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Seed Firestore with initial budgets if empty
      const initial = getInitialBudgets();
      const batch = writeBatch(db);
      
      for (const budget of initial) {
        const docRef = doc(db, BUDGETS_COLLECTION, budget.id);
        batch.set(docRef, budget);
      }
      
      await batch.commit();
      return initial;
    }
    
    const budgets: CampaignBudget[] = [];
    snapshot.forEach((docSnap) => {
      budgets.push(docSnap.data() as CampaignBudget);
    });
    
    return budgets;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BUDGETS_COLLECTION);
    return [];
  }
}

/**
 * Saves or updates a single budget in Firestore.
 */
export async function saveBudgetToFirestore(budget: CampaignBudget): Promise<void> {
  try {
    const docRef = doc(db, BUDGETS_COLLECTION, budget.id);
    await setDoc(docRef, budget);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${BUDGETS_COLLECTION}/${budget.id}`);
  }
}

/**
 * Deletes a single budget from Firestore.
 */
export async function deleteBudgetFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, BUDGETS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${BUDGETS_COLLECTION}/${id}`);
  }
}

/**
 * Fetches the SinaPro catalog from Firestore.
 * If the collection is empty, seeds it with standard SINAPRO_CATALOG items.
 */
export async function getCatalogFromFirestore(): Promise<SinaProItem[]> {
  try {
    const snapshot = await getDocs(collection(db, CATALOG_COLLECTION));
    
    if (snapshot.empty) {
      // Seed Firestore with original catalog if empty
      const batch = writeBatch(db);
      for (const item of SINAPRO_CATALOG) {
        const docRef = doc(db, CATALOG_COLLECTION, item.id);
        batch.set(docRef, item);
      }
      await batch.commit();
      return SINAPRO_CATALOG;
    }
    
    const catalog: SinaProItem[] = [];
    snapshot.forEach((docSnap) => {
      catalog.push(docSnap.data() as SinaProItem);
    });
    
    // Sort catalog by code numeric value if possible
    return catalog.sort((a, b) => {
      const aNum = parseFloat(a.code) || 999;
      const bNum = parseFloat(b.code) || 999;
      return aNum - bNum;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CATALOG_COLLECTION);
    return [];
  }
}

/**
 * Overwrites / Updates the catalog collection with new values.
 */
export async function saveCatalogToFirestore(items: SinaProItem[]): Promise<void> {
  try {
    // Delete all current ones first to support modifications smoothly, or just writeBatch setDoc
    const batch = writeBatch(db);
    for (const item of items) {
      const docRef = doc(db, CATALOG_COLLECTION, item.id);
      batch.set(docRef, item);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CATALOG_COLLECTION);
  }
}

/**
 * Reset Firestore collections to original defaults.
 */
export async function resetFirestoreToDefaults(): Promise<{ budgets: CampaignBudget[]; catalog: SinaProItem[] }> {
  try {
    // 1. Reset catalog
    const catalogBatch = writeBatch(db);
    // Delete current ones & override
    const currentCatalogSnap = await getDocs(collection(db, CATALOG_COLLECTION));
    currentCatalogSnap.forEach((docSnap) => {
      catalogBatch.delete(docSnap.ref);
    });
    
    for (const item of SINAPRO_CATALOG) {
      const docRef = doc(db, CATALOG_COLLECTION, item.id);
      catalogBatch.set(docRef, item);
    }
    await catalogBatch.commit();

    // 2. Reset budgets
    const budgetBatch = writeBatch(db);
    const currentBudgetsSnap = await getDocs(collection(db, BUDGETS_COLLECTION));
    currentBudgetsSnap.forEach((docSnap) => {
      budgetBatch.delete(docSnap.ref);
    });
    
    const initialBudgets = getInitialBudgets();
    for (const budget of initialBudgets) {
      const docRef = doc(db, BUDGETS_COLLECTION, budget.id);
      budgetBatch.set(docRef, budget);
    }
    await budgetBatch.commit();

    return { budgets: initialBudgets, catalog: SINAPRO_CATALOG };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "reset_defaults");
    return { budgets: [], catalog: [] };
  }
}

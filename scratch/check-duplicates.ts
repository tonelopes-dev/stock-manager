
import { getMenuDataBySlug } from './app/_data-access/menu/get-menu-data';

async function checkDuplicates() {
  const slug = 'tonelopes'; // Assuming this is the company slug from previous context or common name
  const menuData = await getMenuDataBySlug(slug);
  if (!menuData) {
    console.log('Menu data not found for slug:', slug);
    return;
  }

  console.log('Checking categories for slug:', slug);
  const categoryIds = new Set();
  menuData.categories.forEach(cat => {
    if (categoryIds.has(cat.id)) {
      console.error('DUPLICATE CATEGORY ID:', cat.id, cat.name);
    }
    categoryIds.add(cat.id);

    const productIds = new Set();
    cat.products.forEach(p => {
      if (productIds.has(p.id)) {
        console.error('DUPLICATE PRODUCT ID IN CATEGORY', cat.name, ':', p.id, p.name);
      }
      productIds.add(p.id);
    });
  });
  console.log('Check finished.');
}

checkDuplicates().catch(console.error);

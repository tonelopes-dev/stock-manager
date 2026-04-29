
import { db } from './app/_lib/prisma';

async function listCategories() {
  const categories = await db.category.findMany({
    select: { id: true, name: true, company: { select: { slug: true } } }
  });
  console.log('Categories:', JSON.stringify(categories, null, 2));
}

listCategories().catch(console.error);

import { db } from '../config/data-source';
import bcrypt from 'bcrypt';

export async function seed() {
  console.log('======== Đang nạp Mock Data... ==========');

  try {
    await db('products').del();
    await db('categories').del();
    await db('users').del();

    const hashedPassword = await bcrypt.hash('123456', 10);
    const [admin, user1] = await db('users')
      .insert([
        {
          email: 'admin@gmail.com',
          password: hashedPassword,
          role: 'admin',
        },
        {
          email: 'john@gmail.com',
          password: hashedPassword,
          role: 'user',
        },
      ])
      .returning('*');

    // 3. Mock Categories
    const [catPhone, catLaptop, catAudio] = await db('categories')
      .insert([
        {
          name: 'Điện thoại',
          description: 'Smartphone và thiết bị di động',
        },
        {
          name: 'Laptop & Máy tính',
          description: 'Máy tính xách tay, PC bàn',
        },
        {
          name: 'Âm thanh',
          description: 'Tai nghe, loa bluetooth',
        },
      ])
      .returning('*');

    // 4. Mock Products (Khớp với schema đã tạo)
    const products = await db('products')
      .insert([
        {
          title: 'iPhone 15 Pro Max 256GB',
          price: 1199.99,
          user_id: admin.id,
          category_id: catPhone.id,
        },
        {
          title: 'Samsung Galaxy S24 Ultra',
          price: 1299.00,
          user_id: user1.id,
          category_id: catPhone.id,
        },
        {
          title: 'MacBook Pro 14 M3 Pro',
          price: 1999.50,
          user_id: admin.id,
          category_id: catLaptop.id,
        },
        {
          title: 'Dell XPS 15 9530',
          price: 1650.00,
          user_id: user1.id,
          category_id: catLaptop.id,
        },
        {
          title: 'Sony WH-1000XM5',
          price: 399.99,
          user_id: admin.id,
          category_id: catAudio.id,
        },
        {
          title: 'AirPods Pro Gen 2',
          price: 249.00,
          user_id: user1.id,
          category_id: catAudio.id,
        },
        {
          title: 'Xiaomi 14 Ultra',
          price: 999.00,
          user_id: user1.id,
          category_id: catPhone.id,
        },
        {
          title: 'Asus ROG Zephyrus G16',
          price: 2199.00,
          user_id: admin.id,
          category_id: catLaptop.id,
        }
      ])
      .returning('*');

    console.log(`==== Đã nạp thành công ${products.length} sản phẩm mẫu! ====`);
  } catch (error) {
    console.error('Lỗi khi seed data:', error);
  } finally {
    await db.destroy();
  }
}

seed();
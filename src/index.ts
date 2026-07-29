import dotenv from 'dotenv';
import app from './app';
import { runAutoMigration } from './services/migrations.service';
import { db } from './config/data-source';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function waitForDatabase(retries = 10, delay = 3000): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      await db.raw('SELECT 1');
      console.log('Kết nối database thành công!');
      return;
    } catch (error) {
      console.log(`Đang chờ database sẵn sàng... (lần ${i}/${retries})`);
      if (i === retries) {
        throw new Error('Không thể kết nối database sau nhiều lần thử.');
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function bootstrap() {
  try {
    // 1. Chờ database sẵn sàng
    await waitForDatabase();

    // 2. Chạy Auto-Migration dựa trên schema.json
    console.log('Đang thực thi Auto-Migration...');
    await runAutoMigration();
    console.log('Hoàn thành Auto-Migration.');

    // 3. Lắng nghe Server
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Không thể khởi động ứng dụng:', error);
    process.exit(1);
  }
}

bootstrap();
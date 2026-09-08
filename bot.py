import os
import json
import requests
from aiogram import Bot, Dispatcher, types, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder
from github import Github

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
GITHUB_TOKEN = os.getenv("MY_GITHUB_TOKEN")
REPO_NAME = "nepomnasihnezont-crypto/Svetlyachok"

bot = Bot(token=TELEGRAM_TOKEN)
dp = Dispatcher()

class AddProduct(StatesGroup):
    title = State()
    custom_title = State()
    price = State()
    gender = State()
    type = State()
    description = State()
    image = State()

@dp.message(Command("start"))
async def cmd_start(message: types.Message, state: FSMContext):
    builder = InlineKeyboardBuilder()
    builder.button(text="👕 Футболка", callback_data="title_Футболка")
    builder.button(text="👖 Штаны", callback_data="title_Штаны")
    builder.button(text="🩳 Шорты", callback_data="title_Шорты")
    builder.button(text="👗 Платье", callback_data="title_Платье")
    builder.button(text="👔 Рубашка", callback_data="title_Рубашка")
    builder.button(text="👟 Обувь", callback_data="title_Обувь")
    builder.button(text="👓 Аксессуар", callback_data="title_Аксессуар")
    builder.button(text="✍️ Ввести свое...", callback_data="title_custom")
    builder.adjust(2)
    
    await message.answer("Выбери название товара из списка или введи свое:", reply_markup=builder.as_markup())
    await state.set_state(AddProduct.title)

@dp.callback_query(AddProduct.title, F.data.startswith("title_"))
async def process_title_callback(callback: types.CallbackQuery, state: FSMContext):
    action = callback.data.split("_")[1]
    await callback.message.delete()
    
    if action == "custom":
        await callback.message.answer("Введи название товара вручную:")
        await state.set_state(AddProduct.custom_title)
    else:
        await state.update_data(title=action)
        await ask_price(callback.message, state)

@dp.message(AddProduct.custom_title)
async def process_custom_title(message: types.Message, state: FSMContext):
    await state.update_data(title=message.text)
    await ask_price(message, state)

async def ask_price(message: types.Message, state: FSMContext):
    await message.answer("Введи цену товара (только число, например: 1500):")
    await state.set_state(AddProduct.price)

@dp.message(AddProduct.price)
async def process_price(message: types.Message, state: FSMContext):
    try:
        price = int(message.text)
    except ValueError:
        await message.answer("Пожалуйста, введи цену цифрами (например: 1500):")
        return
    
    await state.update_data(price=price)
    
    builder = InlineKeyboardBuilder()
    builder.button(text="Женское", callback_data="gender_женское")
    builder.button(text="Мужское", callback_data="gender_мужское")
    builder.button(text="Девочки", callback_data="gender_девочки")
    builder.button(text="Мальчики", callback_data="gender_мальчики")
    builder.adjust(2)
    
    await message.answer("Выбери категорию:", reply_markup=builder.as_markup())
    await state.set_state(AddProduct.gender)

@dp.callback_query(AddProduct.gender, F.data.startswith("gender_"))
async def process_gender(callback: types.CallbackQuery, state: FSMContext):
    gender = callback.data.split("_")[1]
    await state.update_data(gender=gender)
    await callback.message.delete()
    
    builder = InlineKeyboardBuilder()
    builder.button(text="Футболки", callback_data="type_футболки")
    builder.button(text="Штаны", callback_data="type_штаны")
    builder.button(text="Шорты", callback_data="type_шорты")
    builder.button(text="Платья", callback_data="type_платья")
    builder.button(text="Рубашки", callback_data="type_рубашки")
    builder.button(text="Обувь", callback_data="type_обувь")
    builder.button(text="Аксессуары", callback_data="type_аксессуары")
    builder.adjust(2)
    
    await callback.message.answer("Выбери тип товара:", reply_markup=builder.as_markup())
    await state.set_state(AddProduct.type)

@dp.callback_query(AddProduct.type, F.data.startswith("type_"))
async def process_type(callback: types.CallbackQuery, state: FSMContext):
    prod_type = callback.data.split("_")[1]
    await state.update_data(type=prod_type)
    await callback.message.delete()
    
    await callback.message.answer("Напиши описание товара:")
    await state.set_state(AddProduct.description)

@dp.message(AddProduct.description)
async def process_description(message: types.Message, state: FSMContext):
    await state.update_data(description=message.text)
    await message.answer("Отправь фотографию товара:")
    await state.set_state(AddProduct.image)

@dp.message(AddProduct.image, F.photo)
async def process_image(message: types.Message, state: FSMContext):
    data = await state.get_data()
    
    await message.answer("⏳ Загружаю товар на сайт, подожди секунду...")
    
    photo = message.photo[-1]
    file_info = await bot.get_file(photo.file_id)
    image_url = f"https://api.telegram.org/file/bot{TELEGRAM_TOKEN}/{file_info.file_path}"
    
    image_bytes = requests.get(image_url).content
    image_filename = f"images/uploads/{photo.file_unique_id}.jpg"

    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(REPO_NAME)

    # Безопасная загрузка картинки в репозиторий
    try:
        repo.create_file(
            path=image_filename,
            message=f"Add image {photo.file_unique_id}",
            content=image_bytes,
            branch="main"
        )
    except Exception as e:
        print(f"Ошибка загрузки картинки: {e}")

    # Получаем актуальный products.json
    contents = repo.get_contents("content/products/products.json", ref="main")
    try:
        products = json.loads(contents.decoded_content.decode("utf-8"))
        if not isinstance(products, list):
            products = []
    except Exception:
        products = []

    new_product = {
        "title": data["title"],
        "price": data["price"],
        "gender": data["gender"].strip().lower(),
        "type": data["type"].strip().lower(),
        "description": data["description"],
        "image": image_filename,
        "images": []
    }
    products.append(new_product)

    repo.update_file(
        path="content/products/products.json",
        message=f"Add new product: {data['title']}",
        content=json.dumps(products, ensure_ascii=False, indent=4),
        sha=contents.sha,
        branch="main"
    )

    await message.answer("✅ Товар успешно добавлен на сайт!")
    await state.clear()

if __name__ == "__main__":
    import asyncio
    asyncio.run(dp.start_polling(bot))

import os
import json
import requests
from aiogram import Bot, Dispatcher, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.filters import Command
from github import Github

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
GITHUB_TOKEN = os.getenv("MY_GITHUB_TOKEN")
REPO_NAME = "nepomnasihnezont-crypto/Svetlyachok"

bot = Bot(token=TELEGRAM_TOKEN)
dp = Dispatcher()

class AddProduct(StatesGroup):
    title = State()
    price = State()
    gender = State()
    type = State()
    description = State()
    image = State()

@dp.message(Command("start"))
async def cmd_start(message: types.Message, state: FSMContext):
    await message.answer("Привет! Отправь мне название нового товара:")
    await state.set_state(AddProduct.title)

@dp.message(AddProduct.title)
async def process_title(message: types.Message, state: FSMContext):
    await state.update_data(title=message.text)
    await message.answer("Введи цену товара (только число, например: 1500):")
    await state.set_state(AddProduct.price)

@dp.message(AddProduct.price)
async def process_price(message: types.Message, state: FSMContext):
    await state.update_data(price=int(message.text))
    await message.answer("Введи категорию (женское, мужское, девочки, мальчики):")
    await state.set_state(AddProduct.gender)

@dp.message(AddProduct.gender)
async def process_gender(message: types.Message, state: FSMContext):
    await state.update_data(gender=message.text.lower())
    await message.answer("Введи тип товара (футболки, штаны, шорты, платья, рубашки, обувь, аксессуары):")
    await state.set_state(AddProduct.type)

@dp.message(AddProduct.type)
async def process_type(message: types.Message, state: FSMContext):
    await state.update_data(type=message.text.lower())
    await message.answer("Напиши описание товара:")
    await state.set_state(AddProduct.description)

@dp.message(AddProduct.description)
async def process_description(message: types.Message, state: FSMContext):
    await state.update_data(description=message.text)
    await message.answer("Отправь фото товара:")
    await state.set_state(AddProduct.image)

@dp.message(AddProduct.image, lambda m: m.photo)
async def process_image(message: types.Message, state: FSMContext):
    data = await state.get_data()
    
    photo = message.photo[-1]
    file_info = await bot.get_file(photo.file_id)
    file_path = file_info.file_path
    image_url = f"https://api.telegram.org/file/bot{TELEGRAM_TOKEN}/{file_path}"
    
    image_bytes = requests.get(image_url).content
    image_filename = f"images/uploads/{photo.file_unique_id}.jpg"

    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(REPO_NAME)

    repo.create_file(
        path=image_filename,
        message="Add product image via bot",
        content=image_bytes,
        branch="main"
    )

    contents = repo.get_contents("content/products/products.json", ref="main")
    products = json.loads(contents.decoded_content.decode("utf-8"))

    new_product = {
        "title": data["title"],
        "price": data["price"],
        "gender": data["gender"],
        "type": data["type"],
        "description": data["description"],
        "image": image_filename
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

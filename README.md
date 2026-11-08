# đŸ§µ AI-TAILOR: Há»† THá»NG TRĂCH XUáº¤T Sá» ÄO MAY Máº¶C 3D Tá»° Äá»˜NG (ISO 8559)

> **AI-Tailor** lĂ  giáº£i phĂ¡p thá»‹ giĂ¡c mĂ¡y tĂ­nh 3D (3D Computer Vision & Computational Geometry) giĂºp tá»± Ä‘á»™ng trĂ­ch xuáº¥t Ä‘áº§y Ä‘á»§ **8 thĂ´ng sá»‘ nhĂ¢n tráº¯c há»c may máº·c** theo tiĂªu chuáº©n quá»‘c táº¿ **ISO 8559-1** tá»« má»™t bá»©c áº£nh chá»¥p toĂ n thĂ¢n:
> 
> **Chiá»u cao â€¢ VĂ²ng ngá»±c â€¢ VĂ²ng eo â€¢ VĂ²ng hĂ´ng/mĂ´ng â€¢ Chiá»u rá»™ng vai â€¢ Chiá»u dĂ i tay Ă¡o â€¢ Chiá»u dĂ i chĂ¢n trong (Inseam) â€¢ CĂ¢n náº·ng Æ°á»›c tĂ­nh**
> 
> Äá»“ng thá»i há»‡ thá»‘ng tá»± Ä‘á»™ng xuáº¥t **File 3D Avatar (.obj)** Ä‘á»ƒ nháº­p trá»±c tiáº¿p vĂ o cĂ¡c pháº§n má»m thiáº¿t káº¿ thá»i trang 3D (**CLO3D, Marvelous Designer, Browzwear, Blender**) vĂ  tá»± Ä‘á»™ng tÆ° váº¥n kĂ­ch cá»¡ trang phá»¥c (**Size S/M/L/XL, Quáº§n Ă¢u theo Inch, Äá»™ cá»­ Ä‘á»™ng Ease Allowance**).

---

## â¡ ÄIá»‚M Äáº¶C BIá»†T Cá»¦A PHIĂN Báº¢N NĂ€Y (PURE PYTORCH 2.X)
* **100% PyTorch 2.x Thuáº§n:** ÄĂ£ loáº¡i bá» hoĂ n toĂ n cĂ¡c phá»¥ thuá»™c biĂªn dá»‹ch C++/CUDA phá»©c táº¡p (`mesh_mesh_intersect_cuda`, `mmcv.ops.roi_align`).
* **Äá»™c láº­p ná»n táº£ng:** Cháº¡y mÆ°á»£t mĂ  trĂªn **Google Colab**, **MĂ¡y tĂ­nh cĂ¡ nhĂ¢n Windows/Linux**, hoáº·c **MĂ¡y chá»§ thuĂª Ä‘Ă¡m mĂ¢y (Cloud Server / Docker)** mĂ  khĂ´ng lo xung Ä‘á»™t thÆ° viá»‡n.
* **Tá»± Ä‘á»™ng chuyá»ƒn Ä‘á»•i CPU/GPU:** Tá»± nháº­n diá»‡n GPU NVIDIA CUDA; náº¿u mĂ¡y khĂ´ng cĂ³ card rá»i, há»‡ thá»‘ng tá»± Ä‘á»™ng cháº¡y á»Ÿ cháº¿ Ä‘á»™ CPU mĂ  khĂ´ng bá»‹ sáº­p.

---

## đŸ¯ HÆ¯á»NG DáºªN CHáº Y TRĂN CĂC MĂ”I TRÆ¯á»œNG

---

### đŸŸ¢ TRÆ¯á»œNG Há»¢P 1: Táº¢I NGUYĂN THÆ¯ Má»¤C Tá»ª GOOGLE DRIVE (CHáº Y LOCAL MĂY Báº N BĂˆ)

> **DĂ nh cho:** Báº¡n gá»­i cáº£ thÆ° má»¥c dá»± Ă¡n lĂªn Google Drive rá»“i gá»­i link cho báº¡n bĂ¨/Ä‘á»‘i tĂ¡c táº£i vá» cháº¡y trá»±c tiáº¿p trĂªn mĂ¡y cá»§a há» (Windows / Linux) mĂ  khĂ´ng cáº§n cáº¥u hĂ¬nh rÆ°á»m rĂ .

VĂ¬ thÆ° má»¥c trĂªn Google Drive Ä‘Ă£ chá»©a **Ä‘áº§y Ä‘á»§ cáº£ mĂ£ nguá»“n láº«n 5 file trá»ng sá»‘ mĂ´ hĂ¬nh (~800MB)**, ngÆ°á»i nháº­n chá»‰ cáº§n lĂ m theo 3 bÆ°á»›c sau:

#### BÆ°á»›c 1: Giáº£i nĂ©n thÆ° má»¥c vĂ  má»Ÿ Terminal
Má»Ÿ á»©ng dá»¥ng Terminal / PowerShell hoáº·c Command Prompt táº¡i thÆ° má»¥c vá»«a táº£i vá»:
```powershell
cd duong_dan_toi_thu_muc/Focused-Clean-Colab
```

#### BÆ°á»›c 2: CĂ i Ä‘áº·t mĂ´i trÆ°á»ng tá»± Ä‘á»™ng (1 cháº¡m)
* **TrĂªn Windows:** Chá»‰ cáº§n **nháº¥p Ä‘Ăºp chuá»™t vĂ o file `setup_windows.bat`**.  
  *(Script sáº½ tá»± Ä‘á»™ng cĂ i PyTorch, NumPy 1.23.5 vĂ  cĂ¡c thÆ° viá»‡n cáº§n thiáº¿t).*
* **Hoáº·c dĂ¹ng Conda (Windows/Linux/Mac):**
  ```bash
  conda env create -f environment.yml
  conda activate ai-tailor
  ```

#### BÆ°á»›c 3: Cháº¡y Ä‘o Ä‘áº¡c ngay láº­p tá»©c
```powershell
# Cháº¡y Ä‘o tá»« 1 áº£nh (vĂ­ dá»¥ cao 163 cm, náº·ng 64 kg):
python run_measurement.py --image duong_dan_anh.jpg --height_cm 163 --weight_kg 64 --save_mesh avatar.obj
```

#### BÆ°á»›c 4 (TĂ¹y chá»n): Cháº¡y REST API Server Ä‘á»ƒ tĂ­ch há»£p Web / App
```powershell
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```
Má»Ÿ trĂ¬nh duyá»‡t truy cáº­p `http://localhost:8000/docs` Ä‘á»ƒ sá»­ dá»¥ng giao diá»‡n Swagger UI thá»­ nghiá»‡m API.

---

### đŸ”µ TRÆ¯á»œNG Há»¢P 2: CLONE CODE Tá»ª GITHUB HOáº¶C THUĂ MĂY CHá»¦ ÄĂM MĂ‚Y (SERVER / DOCKER)

> **DĂ nh cho:** Láº­p trĂ¬nh viĂªn clone mĂ£ nguá»“n tá»« GitHub: `https://github.com/QuanHoang05/AI-Tailor.git` hoáº·c triá»ƒn khai lĂªn mĂ¡y chá»§ thuĂª (RunPod, Vast.ai, AWS EC2, VPS Ubuntu 22.04).

â ï¸ **LÆ¯U Ă QUAN TRá»ŒNG Vá»€ TRá»ŒNG Sá» MĂ” HĂŒNH (> 100MB):**  
VĂ¬ chĂ­nh sĂ¡ch cá»§a GitHub khĂ´ng cho phĂ©p Ä‘áº©y file lá»›n hÆ¡n 100MB, khi clone code vá» mĂ¡y má»›i, báº¡n cáº§n Ä‘áº·t cĂ¡c file mĂ´ hĂ¬nh vĂ o Ä‘Ăºng cĂ¡c thÆ° má»¥c nhÆ° báº£ng hÆ°á»›ng dáº«n bĂªn dÆ°á»›i.

#### BÆ°á»›c 1: Clone mĂ£ nguá»“n tá»« GitHub
```bash
git clone https://github.com/QuanHoang05/AI-Tailor.git
cd AI-Tailor
```

#### BÆ°á»›c 2: Táº£i vĂ  Ä‘áº·t cĂ¡c file mĂ´ hĂ¬nh vĂ o Ä‘Ăºng thÆ° má»¥c
Báº¡n hĂ£y táº£i hoáº·c copy 5 file trá»ng sá»‘ mĂ´ hĂ¬nh vĂ  Ä‘áº·t chĂ­nh xĂ¡c vĂ o cĂ¡c thÆ° má»¥c sau:

| TĂªn File Trá»ng Sá»‘ | KĂ­ch thÆ°á»›c | Äáº·t chĂ­nh xĂ¡c vĂ o Ä‘Æ°á»ng dáº«n thÆ° má»¥c | Nguá»“n táº£i vá» |
| :--- | :---: | :--- | :--- |
| **`smpler_x_s32.pth.tar`** | 384 MB | `pretrained_models/smpler_x_s32.pth.tar` | [Táº£i tá»« HuggingFace](https://huggingface.co/caizhongang/SMPLer-X/resolve/main/smpler_x_s32.pth.tar) hoáº·c Google Drive |
| **`vitpose_small.pth`** | 97 MB | `pretrained_models/vitpose_small.pth` | [Táº£i tá»« HuggingFace](https://huggingface.co/caizhongang/SMPLer-X/resolve/main/vitpose_small.pth) hoáº·c Google Drive |
| **`SMPLX_NEUTRAL.npz`** | 108 MB | `common/utils/human_model_files/smplx/SMPLX_NEUTRAL.npz` | ÄÄƒng kĂ½ miá»…n phĂ­ táº¡i [SMPL-X Portal](https://smpl-x.is.tue.mpg.de) hoáº·c copy tá»« Drive |
| **`SMPLX_MALE.npz`** | 108 MB | `common/utils/human_model_files/smplx/SMPLX_MALE.npz` | [SMPL-X Portal](https://smpl-x.is.tue.mpg.de) hoáº·c copy tá»« Drive |
| **`SMPLX_FEMALE.npz`** | 108 MB | `common/utils/human_model_files/smplx/SMPLX_FEMALE.npz` | [SMPL-X Portal](https://smpl-x.is.tue.mpg.de) hoáº·c copy tá»« Drive |

*(Gá»£i Ă½: Náº¿u báº¡n cĂ³ sáºµn thÆ° má»¥c trĂªn mĂ¡y tĂ­nh hoáº·c Google Drive, chá»‰ cáº§n nĂ©n 5 file trĂªn thĂ nh file `models.zip` rá»“i dĂ¹ng lá»‡nh `scp` hoáº·c `gdown` táº£i lĂªn server má»™t láº§n duy nháº¥t).*

#### BÆ°á»›c 3: Kiá»ƒm tra tĂ­nh toĂ n váº¹n cá»§a mĂ´ hĂ¬nh
Cháº¡y lá»‡nh kiá»ƒm tra tá»± Ä‘á»™ng:
```bash
python download_models.py
```
Khi mĂ n hĂ¬nh hiá»ƒn thá»‹ Ä‘á»§ 5 dáº¥u tĂ­ch xanh `[âœ“] Sáº´N SĂ€NG`, há»‡ thá»‘ng Ä‘Ă£ sáºµn sĂ ng 100%!

#### BÆ°á»›c 4: Triá»ƒn khai trĂªn Server

* **CĂ¡ch A: DĂ¹ng Docker (Chuáº©n Doanh nghiá»‡p - KhuyĂªn dĂ¹ng):**
  ```bash
  # Build Docker Image:
  docker build -t ai-tailor:latest .

  # Khá»Ÿi cháº¡y Container phá»¥c vá»¥ API 24/7 trĂªn cá»•ng 8000:
  docker run --gpus all -p 8000:8000 -d --name ai_tailor_service ai-tailor:latest python -m uvicorn app:app --host 0.0.0.0 --port 8000
  ```

* **CĂ¡ch B: CĂ i Ä‘áº·t Native trĂªn Ubuntu 22.04:**
  ```bash
  chmod +x setup_colab.sh
  ./setup_colab.sh

  # Cháº¡y Ä‘o thá»­ nghiá»‡m:
  python run_measurement.py --image duong_dan_anh.jpg --height_cm 163 --weight_kg 64
  ```

---

### đŸŸ¡ TRÆ¯á»œNG Há»¢P 3: CHáº Y TRĂN GOOGLE COLAB (GPU T4 MIá»„N PHĂ)

1. Má»Ÿ notebook **`run_on_colab.ipynb`** trĂªn Google Colab.
2. Chá»n Menu **Runtime -> Change runtime type -> T4 GPU**.
3. **Cháº¡y Cell 1 (Mount Drive):** Notebook sáº½ tá»± Ä‘á»™ng tĂ¬m Ä‘Ăºng thÆ° má»¥c dá»± Ă¡n trĂªn Google Drive cá»§a báº¡n.
4. **Cháº¡y Cell 2 (`./setup_colab.sh`):** CĂ i Ä‘áº·t mĂ´i trÆ°á»ng tá»± Ä‘á»™ng (máº¥t ~1-2 phĂºt).
5. **Cháº¡y Cell 3 & 4:** Táº£i áº£nh lĂªn vĂ  báº¥m cháº¡y trĂ­ch xuáº¥t sá»‘ Ä‘o trong 1-2 giĂ¢y.

---

## đŸ“– Báº¢NG THAM Sá» DĂ’NG Lá»†NH (`run_measurement.py`)

| Tham sá»‘ | Kiá»ƒu dá»¯ liá»‡u | Máº·c Ä‘á»‹nh | Ă nghÄ©a & MĂ´ táº£ |
| :--- | :---: | :---: | :--- |
| **`--image`** | `str` | *Báº¯t buá»™c* | ÄÆ°á»ng dáº«n tá»›i file áº£nh toĂ n thĂ¢n (.jpg/.png). |
| **`--height_cm`** | `float` | `None` | Chiá»u cao thá»±c táº¿ (cm). **KhuyĂªn dĂ¹ng** Ä‘á»ƒ chuáº©n hĂ³a tá»‰ lá»‡ ngÆ°á»i 1:1. |
| **`--weight_kg`** | `float` | `None` | CĂ¢n náº·ng thá»±c táº¿ (kg) Ä‘á»ƒ tinh chá»‰nh Ä‘á»™ dĂ y cÆ¡ thá»ƒ báº±ng Adam optimizer. |
| **`--gender`** | `str` | `neutral` | Giá»›i tĂ­nh hĂ¬nh thá»ƒ: `neutral` (trung tĂ­nh), `male` (nam), `female` (ná»¯). |
| **`--save_mesh`** | `str` | `None` | ÄÆ°á»ng dáº«n lÆ°u file 3D Avatar (`.obj` hoáº·c `.ply`) Ä‘á»ƒ kĂ©o vĂ o CLO3D/Blender. |
| **`--output_json`**| `str` | `output_measurements.json` | ÄÆ°á»ng dáº«n lÆ°u file káº¿t quáº£ JSON. |
| **`--device`** | `str` | `cuda:0` / `cpu` | Thiáº¿t bá»‹ tĂ­nh toĂ¡n (tá»± nháº­n diá»‡n GPU CUDA náº¿u cĂ³). |

### VĂ­ dá»¥ cĂ¢u lá»‡nh Ä‘áº§y Ä‘á»§:
```bash
python run_measurement.py \
    --image anh_khach_hang.jpg \
    --height_cm 163.0 \
    --weight_kg 64.0 \
    --gender male \
    --save_mesh avatar_163cm.obj \
    --output_json ket_qua.json
```

---

## đŸ“ CĂ”NG Cá»¤ Äá»I CHUáº¨N THá»°C NGHIá»†M Vá»I THÆ¯á»C DĂ‚Y (`evaluate_benchmark.py`)

Khi báº¡n Ä‘o ngÆ°á»i tháº­t báº±ng thÆ°á»›c dĂ¢y may máº·c, báº¡n cĂ³ thá»ƒ cháº¡y cĂ´ng cá»¥ nĂ y Ä‘á»ƒ kiá»ƒm chá»©ng Ä‘á»™ chĂ­nh xĂ¡c:
```bash
python evaluate_benchmark.py \
    --pred output_measurements.json \
    --real_height 163.0 \
    --real_chest 95.0 \
    --real_waist 80.0 \
    --real_hips 87.0 \
    --real_inseam 72.0 \
    --real_weight 64.0
```

Há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng tĂ­nh sai sá»‘ trung bĂ¬nh tuyá»‡t Ä‘á»‘i (**MAE**) vĂ  tá»· lá»‡ % sai sá»‘, Ä‘á»‘i chiáº¿u vá»›i tiĂªu chuáº©n may Ä‘o cĂ´ng nghiá»‡p (MTM) vĂ  may sáºµn (RTW).

---

## đŸ“¸ NGUYĂN Táº®C CHá»¤P áº¢NH CHUáº¨N MAY Máº¶C (A-POSE)
Äá»ƒ sai sá»‘ Ä‘áº¡t ngÆ°á»¡ng xuáº¥t sáº¯c ($< 1.5\text{ cm}$):
1. **TÆ° tháº¿ chá»¯ A (A-pose):** Äá»©ng tháº³ng, hai chĂ¢n má»Ÿ rá»™ng báº±ng vai (tháº¥y rĂµ Ä‘Å©ng quáº§n), hai tay dang nháº¹ táº¡o gĂ³c $30^\circ - 40^\circ$ vá»›i thĂ¢n ngÆ°á»i (khĂ´ng Ă©p báº¯p tay vĂ o máº¡ng sÆ°á»n).
2. **GĂ³c Ä‘áº·t mĂ¡y:** Äáº·t Ä‘iá»‡n thoáº¡i á»Ÿ Ä‘á»™ cao **ngang rá»‘n / tháº¯t lÆ°ng** ($90 - 100\text{ cm}$ so vá»›i máº·t Ä‘áº¥t), giá»¯ mĂ¡y tháº³ng Ä‘á»©ng $90^\circ$ (khĂ´ng cháº¿ch chĂºc Ä‘áº§u mĂ¡y xuá»‘ng).
3. **Khoáº£ng cĂ¡ch:** Äá»©ng cĂ¡ch camera tá»« **2.5 mĂ©t Ä‘áº¿n 3.0 mĂ©t**.
4. **Trang phá»¥c:** Máº·c Ä‘á»“ má»ng Ă´m sĂ¡t (Ä‘á»“ gym, legging, Ă¡o thun Ă´m).

---

# FitVision 3D (C1SE.12)
### Há»‡ Thá»‘ng Äo NhĂ¢n Tráº¯c Há»c KhĂ´ng Tiáº¿p XĂºc & Thá»­ Äá»“ áº¢o 3D (AI Anthropometrics & 3D Virtual Fitting)

![Tech Stack](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat&logo=tailwindcss)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat&logo=three.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat&logo=supabase)

---

## đŸ“Œ 1. Tá»•ng quan dá»± Ă¡n

**FitVision 3D** lĂ  dá»± Ă¡n thuá»™c há»c pháº§n **Capstone Project (C1SE.12)**, cung cáº¥p giáº£i phĂ¡p toĂ n diá»‡n cho bĂ i toĂ¡n Ä‘o Ä‘áº¡c nhĂ¢n tráº¯c há»c khĂ´ng tiáº¿p xĂºc (Contactless Anthropometry) tá»« áº£nh chá»¥p thĂ´ng thÆ°á»ng (Webcam/Smartphone), tá»± Ä‘á»™ng tĂ­nh toĂ¡n cĂ¡c chá»‰ sá»‘ cÆ¡ thá»ƒ Ä‘áº¡t Ä‘á»™ tin cáº­y theo tiĂªu chuáº©n quá»‘c táº¿ **ISO 8559-1/2**, Ä‘á»“ng thá»i mĂ´ phá»ng tĂ¡i táº¡o hĂ¬nh thá»ƒ **Mannequin 3D tÆ°Æ¡ng tĂ¡c theo thá»i gian thá»±c** trĂªn ná»n táº£ng WebGL (Three.js).

### âœ¨ CĂ¡c tĂ­nh nÄƒng cá»‘t lĂµi:
1. **Pose Guide & Capture**: Giao diá»‡n hÆ°á»›ng dáº«n tÆ° tháº¿ ngÆ°á»i dĂ¹ng chuáº©n A-pose (ChĂ­nh diá»‡n & NghiĂªng 90Â°), kiá»ƒm tra Ä‘á»™ phá»§ toĂ n thĂ¢n vĂ  Ä‘iá»u kiá»‡n Ă¡nh sĂ¡ng.
2. **Computer Vision Pipeline**: TĂ­ch há»£p **MediaPipe Pose** (33 Ä‘iá»ƒm má»‘c xÆ°Æ¡ng cÆ¡ thá»ƒ) vĂ  **OpenCV.js WASM** (xá»­ lĂ½ hĂ¬nh thĂ¡i há»c, phĂ¢n tĂ¡ch ná»n vĂ  chuáº©n hĂ³a tá»‰ lá»‡ Ä‘o lÆ°á»ng qua váº­t chuáº©n chuáº©n hĂ³a).
3. **Bá»™ tĂ­nh toĂ¡n ISO 8559**: á»¨ng dá»¥ng mĂ´ hĂ¬nh xáº¥p xá»‰ chu vi elip Ramanujan cho cĂ¡c máº·t cáº¯t cÆ¡ thá»ƒ (vĂ²ng ngá»±c, vĂ²ng eo, vĂ²ng mĂ´ng) vĂ  so khá»›p báº£ng size chuáº©n (XS, S, M, L, XL, XXL).
4. **Interactive 3D Mannequin**: TĂ¡i hiá»‡n hĂ¬nh thá»ƒ 3D dÆ°á»›i dáº¡ng parametric mesh báº±ng **Three.js**, há»— trá»£ xoay 360Â°, cháº¿ Ä‘á»™ Wireframe/Shaded vĂ  cĂ¡c vĂ²ng Ä‘o kĂ­ch thÆ°á»›c trá»±c quan.
5. **Dá»‹ch vá»¥ Cloud Supabase**: Quáº£n lĂ½ há»“ sÆ¡ ngÆ°á»i dĂ¹ng vĂ  Ä‘á»“ng bá»™ lá»‹ch sá»­ phiĂªn quĂ©t cÆ¡ thá»ƒ an toĂ n.

---

## đŸ“ 2. Cáº¥u trĂºc thÆ° má»¥c (Architecture Design)

Dá»± Ă¡n Ä‘Æ°á»£c cáº¥u trĂºc dáº¡ng Module-Driven Architecture theo sĂ¡t tĂ i liá»‡u thiáº¿t káº¿ há»‡ thá»‘ng:

```text
fitvision-3d/
â”œâ”€â”€ public/                     # Static assets & model weights
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ assets/                 # Icons, logo, hĂ¬nh áº£nh tÄ©nh
â”‚   â”œâ”€â”€ components/             # Reusable UI components & Layout chung
â”‚   â”‚   â”œâ”€â”€ ui/                 # Button, Badge, Card (Glassmorphism design system)
â”‚   â”‚   â”œâ”€â”€ Navbar.tsx          # Thanh Ä‘iá»u hÆ°á»›ng vá»›i status badge & logo
â”‚   â”‚   â”œâ”€â”€ Layout.tsx          # Wrapper layout ná»n cyber-grid & ambient glow
â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”œâ”€â”€ features/               # CĂ¡c module tĂ­nh nÄƒng chuyĂªn biá»‡t
â”‚   â”‚   â”œâ”€â”€ capture/            # Chá»¥p áº£nh vĂ  kĂ­nh ngáº¯m hÆ°á»›ng dáº«n tÆ° tháº¿ (Pose Guide)
â”‚   â”‚   â”‚   â”œâ”€â”€ CameraFeed.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ PoseGuideOverlay.tsx
â”‚   â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”‚   â”œâ”€â”€ cv/                 # MediaPipe Pose BlazePose & OpenCV.js WASM
â”‚   â”‚   â”‚   â”œâ”€â”€ mediapipe.ts    # Pipeline 33 Ä‘iá»ƒm má»‘c vĂ  liĂªn káº¿t xÆ°Æ¡ng
â”‚   â”‚   â”‚   â”œâ”€â”€ opencv.ts       # Module WASM vĂ  hiá»‡u chuáº©n thÆ°á»›c Ä‘o pixel-to-metric
â”‚   â”‚   â”‚   â”œâ”€â”€ CVMonitorCard.tsx
â”‚   â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”‚   â”œâ”€â”€ anthropometry/      # Bá»™ tĂ­nh toĂ¡n sá»‘ Ä‘o chuáº©n ISO 8559
â”‚   â”‚   â”‚   â”œâ”€â”€ calculator.ts   # Thuáº­t toĂ¡n tĂ­nh toĂ¡n sá»‘ Ä‘o (Ramanujan Ellipse Model)
â”‚   â”‚   â”‚   â”œâ”€â”€ isoStandards.ts # Báº£ng size quy chuáº©n ISO 8559 cho Nam & Ná»¯
â”‚   â”‚   â”‚   â”œâ”€â”€ AnthropometryDisplay.tsx
â”‚   â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”‚   â””â”€â”€ avatar3d/           # Three.js WebGL canvas & render mannequin 3D
â”‚   â”‚       â”œâ”€â”€ meshGenerator.ts# Bá»™ sinh hĂ¬nh há»c Mannequin tham sá»‘ hĂ³a
â”‚   â”‚       â”œâ”€â”€ MannequinViewer.tsx
â”‚   â”‚       â””â”€â”€ index.ts
â”‚   â”œâ”€â”€ services/               # Supabase client vĂ  táº§ng káº¿t ná»‘i API
â”‚   â”‚   â”œâ”€â”€ supabase.ts         # Khá»Ÿi táº¡o client & CRUD sá»‘ Ä‘o / profile
â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”œâ”€â”€ types/                  # TypeScript Interfaces (ISO 8559, Profile, Pose)
â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”œâ”€â”€ App.tsx                 # Dashboard tĂ­ch há»£p trung tĂ¢m Ä‘iá»u khiá»ƒn
â”‚   â”œâ”€â”€ index.css               # Tailwind CSS & Design tokens
â”‚   â””â”€â”€ main.tsx                # Entry point á»©ng dá»¥ng React
â”œâ”€â”€ .env.example                # File máº«u cáº¥u hĂ¬nh biáº¿n mĂ´i trÆ°á»ng
â”œâ”€â”€ tailwind.config.js          # Cáº¥u hĂ¬nh Tailwind CSS v3
â”œâ”€â”€ postcss.config.js           # Cáº¥u hĂ¬nh PostCSS & Autoprefixer
â”œâ”€â”€ tsconfig.app.json           # Cáº¥u hĂ¬nh TypeScript & path alias (@/*)
â”œâ”€â”€ vite.config.ts              # Cáº¥u hĂ¬nh Vite bundler
â””â”€â”€ package.json                # Danh sĂ¡ch dependencies & scripts
```

---

## đŸ€ 3. HÆ°á»›ng dáº«n cĂ i Ä‘áº·t vĂ  cháº¡y á»©ng dá»¥ng

### BÆ°á»›c 1: Clone mĂ£ nguá»“n hoáº·c di chuyá»ƒn vĂ o thÆ° má»¥c dá»± Ă¡n
```bash
cd fitvision-3d
```

### BÆ°á»›c 2: CĂ i Ä‘áº·t cĂ¡c gĂ³i phá»¥ thuá»™c (Dependencies)
```bash
npm install
```

### BÆ°á»›c 3: Cáº¥u hĂ¬nh biáº¿n mĂ´i trÆ°á»ng
Táº¡o file `.env` tá»« file máº«u `.env.example`:
```bash
# TrĂªn Windows PowerShell:
Copy-Item .env.example .env

# Hoáº·c trĂªn Linux/macOS:
cp .env.example .env
```
Má»Ÿ file `.env` vĂ  cáº­p nháº­t thĂ´ng tin Supabase cá»§a báº¡n (náº¿u chÆ°a cĂ³, há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng cháº¡y cháº¿ Ä‘á»™ Mock/Demo an toĂ n mĂ  khĂ´ng bá»‹ crash):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### BÆ°á»›c 4: Khá»Ÿi cháº¡y mĂ´i trÆ°á»ng phĂ¡t triá»ƒn (Development Server)
```bash
npm run dev
```
Sau khi cháº¡y lá»‡nh, truy cáº­p trĂ¬nh duyá»‡t theo Ä‘á»‹a chá»‰ hiá»ƒn thá»‹ táº¡i terminal (thĂ´ng thÆ°á»ng lĂ  `http://localhost:5173`).

---

## đŸ› ï¸ 4. CĂ¡c lá»‡nh há»¯u Ă­ch khĂ¡c

| Lá»‡nh | Ă nghÄ©a |
| :--- | :--- |
| `npm run dev` | Khá»Ÿi Ä‘á»™ng Vite dev server vá»›i Hot Module Replacement (HMR). |
| `npm run build` | Kiá»ƒm tra kiá»ƒu TypeScript vĂ  Ä‘Ă³ng gĂ³i mĂ£ nguá»“n cho mĂ´i trÆ°á»ng Production. |
| `npm run preview` | Khá»Ÿi cháº¡y mĂ¡y chá»§ cá»¥c bá»™ xem trÆ°á»›c báº£n build production. |
| `npm run lint` | Cháº¡y linter kiá»ƒm tra cĂº phĂ¡p vĂ  cháº¥t lÆ°á»£ng mĂ£ nguá»“n. |

---

## đŸ‘¥ ÄÆ¡n vá»‹ thá»±c hiá»‡n
- **Dá»± Ă¡n**: FitVision 3D (Contactless Anthropometry & 3D Virtual Fitting System)
- **MĂ£ há»c pháº§n**: C1SE.12


@echo off
title FitVision 3D - Full Stack with AI
echo =======================================================================
echo   FitVision 3D - Khoi dong Frontend (5173) + Backend (5000) + AI (8000)
echo =======================================================================
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
set TORCH_HOME=%~dp0ai-service\pretrained_models
set HF_HOME=%~dp0ai-service\pretrained_models
set HUGGINGFACE_HUB_CACHE=%~dp0ai-service\pretrained_models
npm run dev:full
pause


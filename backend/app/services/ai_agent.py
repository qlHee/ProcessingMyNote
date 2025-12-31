"""
AI Agent Service - Natural language to image processing parameters
Uses DeepSeek API to interpret user instructions and adjust image parameters
"""
import json
import httpx
from typing import Optional
from app.config import settings


# Default processing parameters
DEFAULT_PARAMS = {
    "block_size": 11,
    "c": 2,
    "contrast": 1.0,
    "brightness": 0,
    "denoise_strength": 10,
    "sharpen": True,
}

# Parameter adjustment rules for common requests
# 规则按优先级排序，更具体的规则放在前面
ADJUSTMENT_RULES = [
    # ===== 字迹深浅相关 =====
    # 字迹太淡/浅，需要加深（温和调整，避免黑底）
    (["字迹太淡", "字太淡", "太淡了", "太浅了", "字迹浅", "看不清字", "字不清楚"], {"contrast": 0.2, "c": -2}),
    (["加深", "深一点", "更深", "颜色深"], {"contrast": 0.15, "c": -1}),
    (["淡", "浅"], {"contrast": 0.1, "c": -1}),
    
    # 字迹太深/黑，需要变浅
    (["太深", "太黑", "字太黑", "太重"], {"contrast": -0.2, "c": 3}),
    (["变浅", "浅一点", "淡一点"], {"contrast": -0.15, "c": 2}),
    
    # ===== 字迹粗细相关 =====
    (["字太细", "太细了", "笔画细", "加粗", "粗一点"], {"block_size": 2, "c": -1}),
    (["字太粗", "太粗了", "笔画粗", "变细", "细一点"], {"block_size": -2, "c": 1}),
    
    # ===== 对比度相关 =====
    (["对比度太低", "对比度低", "对比不够", "对比度不够", "增加对比", "对比度太弱", "对比弱"], {"contrast": 0.4}),
    (["对比度太高", "对比度高", "对比太强", "降低对比", "对比度太强"], {"contrast": -0.3}),
    (["提高对比", "加强对比", "对比度"], {"contrast": 0.3}),
    
    # ===== 亮度相关 =====
    (["太亮", "太亮了", "亮度太高", "过曝", "曝光过度"], {"brightness": -20}),
    (["太暗", "太暗了", "亮度太低", "欠曝", "曝光不足"], {"brightness": 20}),
    (["更亮", "亮一点", "提高亮度", "增加亮度"], {"brightness": 15}),
    (["更暗", "暗一点", "降低亮度", "减少亮度"], {"brightness": -15}),
    
    # ===== 清晰度/模糊相关 =====
    (["太模糊", "很模糊", "模糊了", "不清晰", "不够清晰", "看不清"], {"sharpen": True, "denoise_strength": -5}),
    (["模糊", "糊"], {"sharpen": True, "denoise_strength": -3}),
    (["更清晰", "清晰一点", "锐化", "更锐利"], {"sharpen": True, "denoise_strength": -2}),
    
    # ===== 噪点相关 =====
    (["噪点太多", "噪点多", "很多噪点", "杂点太多", "颗粒感太强"], {"denoise_strength": 8}),
    (["噪点", "杂点", "颗粒", "去噪", "降噪", "有噪点"], {"denoise_strength": 5}),
    (["太平滑", "过度降噪", "细节丢失"], {"denoise_strength": -5}),
    
    # ===== 背景相关 =====
    (["背景不够白", "背景不白", "背景灰", "背景发灰", "背景太灰"], {"c": 4, "brightness": 10}),
    (["背景脏", "背景有杂色", "背景不干净"], {"c": 3, "denoise_strength": 5}),
    (["背景更白", "背景白一点", "纯白背景"], {"c": 5, "brightness": 15}),
    (["背景太白", "背景过曝"], {"c": -2, "brightness": -10}),
    
    # ===== 整体效果 =====
    (["效果不好", "处理效果差", "不满意"], {"contrast": 0.2, "c": -1, "sharpen": True}),
    (["恢复", "还原", "重置"], {}),  # 空调整，会触发默认参数
]


class AIAgent:
    """
    AI Agent for interpreting natural language image adjustment requests
    """
    
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.api_url = settings.DEEPSEEK_API_URL
    
    async def interpret_instruction(
        self, 
        instruction: str,
        current_params: dict = None
    ) -> dict:
        """
        Interpret natural language instruction and return adjusted parameters
        
        Args:
            instruction: User's natural language instruction (e.g., "字迹太淡了，加深一点")
            current_params: Current processing parameters
            
        Returns:
            Adjusted parameters dictionary
        """
        current = current_params or DEFAULT_PARAMS.copy()
        
        # 优先使用 DeepSeek API 进行智能调整
        if self.api_key:
            try:
                print(f"Using DeepSeek API for instruction: {instruction}")
                result = await self._ai_adjust(instruction, current)
                print(f"DeepSeek API result: {result}")
                return result
            except Exception as e:
                print(f"DeepSeek API error: {e}, falling back to rule-based")
        
        # API不可用时，回退到规则匹配
        rule_result = self._rule_based_adjust(instruction, current)
        if rule_result:
            return rule_result
        
        # 都失败时返回当前参数不变
        return current
    
    def _rule_based_adjust(self, instruction: str, current: dict) -> Optional[dict]:
        """
        Rule-based parameter adjustment for common requests
        使用列表格式的规则，按优先级匹配
        """
        result = current.copy()
        matched = False
        
        # 遍历规则列表
        for keywords, adjustments in ADJUSTMENT_RULES:
            # 检查是否有任何关键词匹配
            for keyword in keywords:
                if keyword in instruction:
                    matched = True
                    # 应用调整
                    for param, delta in adjustments.items():
                        if param == "sharpen":
                            result[param] = delta
                        elif param in result:
                            if isinstance(result[param], bool):
                                result[param] = delta
                            else:
                                result[param] = result[param] + delta
                    break  # 每条规则只匹配一次
        
        if matched:
            # Clamp values to valid ranges
            result = self._clamp_params(result)
            return result
        
        return None
    
    def _clamp_params(self, params: dict) -> dict:
        """Ensure parameters are within valid ranges"""
        clamped = params.copy()
        
        # block_size: 3-31, must be odd
        if "block_size" in clamped:
            clamped["block_size"] = max(3, min(31, int(clamped["block_size"])))
            if clamped["block_size"] % 2 == 0:
                clamped["block_size"] += 1
        
        # c: -5 to 15 (关键！太小的负值会导致黑底白字)
        # c值控制二值化阈值偏移，负值使字更深但背景可能变灰/黑
        if "c" in clamped:
            clamped["c"] = max(-5, min(15, int(clamped["c"])))
        
        # contrast: 0.5 to 2.0
        if "contrast" in clamped:
            clamped["contrast"] = max(0.5, min(2.0, float(clamped["contrast"])))
        
        # brightness: -50 to 50
        if "brightness" in clamped:
            clamped["brightness"] = max(-50, min(50, int(clamped["brightness"])))
        
        # denoise_strength: 0 to 20
        if "denoise_strength" in clamped:
            clamped["denoise_strength"] = max(0, min(20, int(clamped["denoise_strength"])))
        
        return clamped
    
    async def _ai_adjust(self, instruction: str, current: dict) -> dict:
        """
        Use DeepSeek API to interpret complex instructions
        """
        system_prompt = """你是一个专业的笔记图片处理参数调整助手。这是一个将手写笔记照片处理成扫描件效果的应用。

用户会用自然语言描述他们对图片处理效果的不满意之处，你需要理解用户的意图并返回调整后的参数。

## 重要警告：
- 调整幅度要**温和保守**，每次只做小幅调整
- 绝对不要返回极端值，否则会破坏图像效果
- 目标始终是：白色背景 + 清晰黑色字迹

## 可调整的参数及其作用：

1. **contrast** (对比度, 范围: 0.5-2.0, 默认: 1.0)
   - 控制图像整体对比度
   - 用户说"字迹太淡"时，小幅增加到 1.2-1.4
   - 用户说"太黑"时，小幅降低到 0.8-0.9
   - **不要超过1.5，否则效果会很差**

2. **brightness** (亮度, 范围: -50 到 50, 默认: 0)
   - 控制整体亮度
   - 用户说"太暗"时，增加 5-15
   - 用户说"背景不够白"时，增加 5-10

3. **c** (阈值偏移, 范围: -5 到 15, 默认: 2)
   - **关键参数！** 控制二值化阈值
   - **警告：c值绝对不能低于-5，否则会变成黑底白字！**
   - 用户说"背景不够白"时，增加到 4-8
   - 用户说"字迹太淡"时，降低到 0 或 -2（最多到-3）
   - 正常调整范围：-3 到 10

4. **block_size** (块大小, 范围: 5-25, 必须是奇数, 默认: 11)
   - 值越大，字迹越粗
   - 用户说"字太细"时，增加到 13-15
   - 用户说"字太粗"时，降低到 7-9

5. **denoise_strength** (降噪强度, 范围: 0-20, 默认: 10)
   - 用户说"噪点多"时，增加到 13-15
   - 用户说"模糊"时，降低到 5-7

## 常见用户需求的参数调整：

- "字迹太淡/加深一点": {"contrast": 1.2, "c": 0}
- "背景不够白": {"c": 6, "brightness": 8}
- "对比度太低": {"contrast": 1.3}
- "太模糊": {"denoise_strength": 6}
- "噪点太多": {"denoise_strength": 14}

## 输出格式：
只返回纯JSON对象，包含需要调整的参数的**最终值**。
例如：{"contrast": 1.2, "c": 0}

不要返回任何解释文字，只返回JSON。"""

        user_prompt = f"""当前图片处理参数：
{json.dumps(current, indent=2)}

用户的调整要求："{instruction}"

请根据用户要求，返回调整后的参数（JSON格式，只包含需要修改的参数的最终值）："""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 200,
                },
                timeout=30.0,
            )
            
            if response.status_code != 200:
                error_text = response.text
                print(f"DeepSeek API error response: {error_text}")
                raise Exception(f"API error: {response.status_code} - {error_text}")
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            print(f"DeepSeek API raw response: {content}")
            
            # Parse JSON from response
            try:
                # Try to extract JSON from the response
                json_match = content.strip()
                
                # 处理可能的代码块格式
                if "```" in json_match:
                    # Extract from code block
                    parts = json_match.split("```")
                    for part in parts:
                        part = part.strip()
                        if part.startswith("json"):
                            part = part[4:].strip()
                        if part.startswith("{"):
                            json_match = part
                            break
                
                # 尝试找到JSON对象
                if not json_match.startswith("{"):
                    # 尝试从文本中提取JSON
                    start = json_match.find("{")
                    end = json_match.rfind("}") + 1
                    if start != -1 and end > start:
                        json_match = json_match[start:end]
                
                print(f"Extracted JSON: {json_match}")
                adjustments = json.loads(json_match)
                print(f"Parsed adjustments: {adjustments}")
                
                # Apply adjustments to current params
                result_params = current.copy()
                for key, value in adjustments.items():
                    if key in result_params:
                        result_params[key] = value
                
                final_params = self._clamp_params(result_params)
                print(f"Final params after clamp: {final_params}")
                return final_params
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}, content was: {content}")
                raise Exception(f"Failed to parse AI response: {e}")


# Singleton instance
ai_agent = AIAgent()


async def interpret_adjustment(instruction: str, current_params: dict = None) -> dict:
    """Convenience function for parameter interpretation"""
    return await ai_agent.interpret_instruction(instruction, current_params)

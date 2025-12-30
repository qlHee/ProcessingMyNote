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
ADJUSTMENT_RULES = {
    # 字迹相关
    "太淡": {"contrast": 0.2, "c": -2},
    "太浅": {"contrast": 0.2, "c": -2},
    "加深": {"contrast": 0.2, "c": -2},
    "更深": {"contrast": 0.3, "c": -3},
    "太深": {"contrast": -0.2, "c": 2},
    "太黑": {"contrast": -0.2, "c": 2},
    "变浅": {"contrast": -0.15, "c": 1},
    
    # 字迹粗细
    "太细": {"block_size": 2, "c": -1},
    "加粗": {"block_size": 2, "c": -1},
    "太粗": {"block_size": -2, "c": 1},
    "变细": {"block_size": -2, "c": 1},
    
    # 亮度相关
    "太亮": {"brightness": -15},
    "太暗": {"brightness": 15},
    "更亮": {"brightness": 10},
    "更暗": {"brightness": -10},
    
    # 清晰度
    "模糊": {"sharpen": True, "denoise_strength": -3},
    "不清晰": {"sharpen": True, "denoise_strength": -3},
    "更清晰": {"sharpen": True, "denoise_strength": -2},
    "锐化": {"sharpen": True},
    
    # 噪点
    "噪点": {"denoise_strength": 5},
    "杂点": {"denoise_strength": 5},
    "颗粒": {"denoise_strength": 5},
    "去噪": {"denoise_strength": 5},
    
    # 背景
    "背景脏": {"c": 2, "denoise_strength": 3},
    "背景不白": {"c": 3, "brightness": 5},
    "背景更白": {"c": 2, "brightness": 8},
}


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
        
        # Try rule-based adjustment first (faster, no API needed)
        rule_result = self._rule_based_adjust(instruction, current)
        if rule_result:
            return rule_result
        
        # If API key is available, use DeepSeek for complex instructions
        if self.api_key:
            try:
                return await self._ai_adjust(instruction, current)
            except Exception as e:
                print(f"AI API error: {e}, falling back to rule-based")
        
        # Fallback: return current params unchanged
        return current
    
    def _rule_based_adjust(self, instruction: str, current: dict) -> Optional[dict]:
        """
        Rule-based parameter adjustment for common requests
        """
        result = current.copy()
        matched = False
        
        for keyword, adjustments in ADJUSTMENT_RULES.items():
            if keyword in instruction:
                matched = True
                for param, delta in adjustments.items():
                    if param == "sharpen":
                        result[param] = delta
                    elif param in result:
                        if isinstance(result[param], bool):
                            result[param] = delta
                        else:
                            result[param] = result[param] + delta
        
        if matched:
            # Clamp values to valid ranges
            result = self._clamp_params(result)
            return result
        
        return None
    
    def _clamp_params(self, params: dict) -> dict:
        """Ensure parameters are within valid ranges"""
        clamped = params.copy()
        
        # block_size: 3-99, must be odd
        if "block_size" in clamped:
            clamped["block_size"] = max(3, min(99, clamped["block_size"]))
            if clamped["block_size"] % 2 == 0:
                clamped["block_size"] += 1
        
        # c: -50 to 50
        if "c" in clamped:
            clamped["c"] = max(-50, min(50, clamped["c"]))
        
        # contrast: 0.1 to 3.0
        if "contrast" in clamped:
            clamped["contrast"] = max(0.1, min(3.0, clamped["contrast"]))
        
        # brightness: -100 to 100
        if "brightness" in clamped:
            clamped["brightness"] = max(-100, min(100, clamped["brightness"]))
        
        # denoise_strength: 0 to 30
        if "denoise_strength" in clamped:
            clamped["denoise_strength"] = max(0, min(30, clamped["denoise_strength"]))
        
        return clamped
    
    async def _ai_adjust(self, instruction: str, current: dict) -> dict:
        """
        Use DeepSeek API to interpret complex instructions
        """
        system_prompt = """你是一个图像处理参数调整助手。用户会用自然语言描述他们对笔记图片处理效果的不满意之处。
你需要根据用户的描述，调整以下参数：

参数说明：
- block_size (3-99, 奇数): 自适应阈值的邻域大小，越大字迹越粗
- c (-50 to 50): 阈值偏移，越小字迹越深/黑
- contrast (0.1-3.0): 对比度，越大对比越强
- brightness (-100 to 100): 亮度，正值更亮
- denoise_strength (0-30): 降噪强度，越大越平滑
- sharpen (true/false): 是否锐化

请只返回JSON格式的参数调整，例如：
{"contrast": 1.2, "c": -1}

只返回需要修改的参数，不需要返回所有参数。"""

        user_prompt = f"""当前参数：{json.dumps(current)}
用户反馈：{instruction}

请返回需要调整的参数（JSON格式）："""

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
                raise Exception(f"API error: {response.status_code}")
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON from response
            try:
                # Try to extract JSON from the response
                json_match = content
                if "```" in content:
                    # Extract from code block
                    json_match = content.split("```")[1]
                    if json_match.startswith("json"):
                        json_match = json_match[4:]
                
                adjustments = json.loads(json_match.strip())
                
                # Apply adjustments to current params
                result_params = current.copy()
                for key, value in adjustments.items():
                    if key in result_params:
                        result_params[key] = value
                
                return self._clamp_params(result_params)
            except json.JSONDecodeError:
                return current


# Singleton instance
ai_agent = AIAgent()


async def interpret_adjustment(instruction: str, current_params: dict = None) -> dict:
    """Convenience function for parameter interpretation"""
    return await ai_agent.interpret_instruction(instruction, current_params)

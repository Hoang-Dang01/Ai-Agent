using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.ML.OnnxRuntimeGenAI;

namespace OfflineAgent.Core.Vision
{
    public class LocalVisionModel : IDisposable
    {
        private Model? _model;
        private Tokenizer? _tokenizer;
        private readonly string _modelPath;
        private bool _isLoaded = false;
        private readonly object _lock = new object();

        public LocalVisionModel(string modelPath)
        {
            _modelPath = modelPath;
        }

        /// <summary>
        /// Nạp mô hình ONNX và Tokenizer vào bộ nhớ RAM máy trạm.
        /// </summary>
        public void Load()
        {
            lock (_lock)
            {
                if (_isLoaded) return;

                if (!Directory.Exists(_modelPath))
                {
                    throw new DirectoryNotFoundException($"Không tìm thấy thư mục mô hình ONNX tại: {Path.GetFullPath(_modelPath)}");
                }

                // Khởi dựng mô hình GenAI từ ONNX Runtime
                _model = new Model(_modelPath);
                _tokenizer = new Tokenizer(_model);
                _isLoaded = true;
            }
        }

        /// <summary>
        /// Sinh văn bản thời gian thực (Streaming Text Generation) từ Prompt hệ thống và đầu vào người dùng.
        /// </summary>
        public async Task<string> GenerateTextAsync(string systemPrompt, string userPrompt, Action<string>? onTokenGenerated = null)
        {
            return await Task.Run(() =>
            {
                lock (_lock)
                {
                    if (!_isLoaded)
                    {
                        Load();
                    }
                }

                if (_model == null || _tokenizer == null)
                {
                    throw new InvalidOperationException("Mô hình chưa được khởi tạo thành công.");
                }

                // Ghép nối prompt theo định dạng Chat Template chuẩn của Qwen2.5-Instruct
                var fullPrompt = $"<|im_start|>system\n{systemPrompt}<|im_end|>\n<|im_start|>user\n{userPrompt}<|im_end|>\n<|im_start|>assistant\n";

                // Mã hóa chuỗi text thành chuỗi tokens
                var tokens = _tokenizer.Encode(fullPrompt);

                using (var generatorParams = new GeneratorParams(_model))
                {
                    // Thiết lập các tham số tối ưu hóa tìm kiếm sinh từ
                    generatorParams.SetSearchOption("max_length", 2048);
                    generatorParams.SetSearchOption("temperature", 0.7);
                    generatorParams.SetSearchOption("top_k", 50);

                    using (var generator = new Generator(_model, generatorParams))
                    {
                        generator.AppendTokenSequences(tokens);

                        var sb = new StringBuilder();

                        using (var tokenizerStream = _tokenizer.CreateStream())
                        {
                            // Vòng lặp sinh chữ cho đến khi gặp token kết thúc (eos) hoặc đạt giới hạn max_length
                            while (!generator.IsDone())
                            {
                                try
                                {
                                    generator.GenerateNextToken();
                                    var sequence = generator.GetSequence(0);
                                    if (sequence.Length > 0)
                                    {
                                        var lastTokenId = sequence.ToArray()[^1];
                                        var piece = tokenizerStream.Decode(lastTokenId);

                                        if (!string.IsNullOrEmpty(piece))
                                        {
                                            sb.Append(piece);
                                            onTokenGenerated?.Invoke(piece);
                                        }
                                    }
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[GenAI Loop] Cảnh báo lỗi sinh token: {ex.Message}");
                                    break;
                                }
                            }
                        }

                        return sb.ToString();
                    }
                }
            });
        }

        /// <summary>
        /// Giải phóng tài nguyên RAM nạp mô hình khi ứng dụng đóng cửa sổ
        /// </summary>
        public void Dispose()
        {
            lock (_lock)
            {
                _tokenizer?.Dispose();
                _model?.Dispose();
                _tokenizer = null;
                _model = null;
                _isLoaded = false;
            }
        }
    }
}
